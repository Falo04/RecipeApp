use std::pin::pin;
use std::time::Duration;

use axum::body::Bytes;
use axum::extract::ws::Message;
use axum::extract::ws::Utf8Bytes;
use axum::extract::ws::WebSocket;
use axum::extract::WebSocketUpgrade;
use axum::response::IntoResponse;
use axum::response::Response;
use galvyn::core::session::Session;
use galvyn::core::Module;
use galvyn::get;
use tokio::select;
use tokio::sync::mpsc::channel;
use tokio::sync::mpsc::Receiver;
use tokio::time::interval;
use tokio::time::sleep;
use tokio::time::Instant;
use tokio::time::MissedTickBehavior;
use tracing::debug;
use tracing::error;
use tracing::trace;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::handler::websockets::schema::WsServerMsg;
use crate::modules::websockets::WebsocketManager;

#[get("/")]
pub async fn open_websocket(ws: WebSocketUpgrade, session: Session) -> ApiResult<WsResponse> {
    let id = session
        .id()
        .ok_or(ApiError::server_error("The session should have an id"))?;

    error!(id = ?id, "Session id");

    let on_upgrade = move |ws| async move {
        let (server_tx, server_rx) = channel(1);
        WebsocketManager::global().register(id, server_tx).await;
        handle_ws(ws, server_rx).await;
    };

    Ok(WsResponse(ws.on_upgrade(on_upgrade)))
}

struct WsResponse(Response);

impl IntoResponse for WsResponse {
    fn into_response(self) -> Response {
        self.0.into_response()
    }
}

async fn handle_ws(mut ws: WebSocket, mut server: Receiver<WsServerMsg>) {
    let mut heartbeat = interval(Duration::from_secs(10));
    heartbeat.set_missed_tick_behavior(MissedTickBehavior::Delay);

    let mut timeout = pin!(sleep(Duration::from_secs(60)));

    loop {
        select! {
            _ = timeout.as_mut() => {
                debug!("Heartbeat timed expired");
                let _ = ws.send(Message::Close(None)).await;
                return;
            }
            _ = heartbeat.tick() => {
                if let Err(error) = ws.send(Message::Ping(Bytes::new())).await {
                    debug!(error.display = %error, error.debug = ?error, "Failed to send ping");
                    return;
                } else {
                    trace!("Send ping");
                }
            }
            option = ws.recv() => {
                let Some(Ok(msg)) = option else {
                    debug!("Client stream has been closed");
                    return;
                };

                match msg {
                    Message::Text(text) => {
                        trace!(%text, "Received text");
                    }
                    Message::Binary(binary) => {
                        trace!(?binary, "Received binary");
                    }
                    Message::Ping(data) => {
                        trace!(data.len = data.len(), data = ?data, "Received ping");

                        if let Err(error) = ws.send(Message::Pong(data)).await {
                            debug!(error.display = %error, error.debug = ?error, "Failed to send pong");
                            return;
                        } else {
                            trace!("Send pong");
                        }
                    }
                    Message::Pong(data) => {
                        trace!(data.len = data.len(), data = ?data, "Received pong");
                        timeout.as_mut().reset(Instant::now() + Duration::from_secs(60));
                    }
                    Message::Close(_) => {
                        debug!("Client closed");
                        return;
                    }
                }
            }
            option = server.recv() => {
                let Some(server_msg) = option else {
                    if let Err(error) = ws.send(Message::Close(None)).await {
                        debug!(error.display = ?error, error.debug = ?error, "Failed to send close");
                    } else {
                        debug!("Send close");
                    }
                    return;
                };

                let Ok(serialized) = serde_json::to_string(&server_msg) else {
                    continue;
                };

                if let Err(error) = ws.send(Message::Text(Utf8Bytes::from(serialized))).await {
                    debug!(error.display = ?error, error.debug = ?error, "Failed to send text");
                } else {
                    trace!(msg = ?server_msg, "Send text");
                }
            }
        }
    }
}
