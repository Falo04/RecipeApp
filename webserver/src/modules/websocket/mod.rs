//! Manages  websocket and handles commands.
use std::time::Duration;

use futures_util::future::join_all;
use galvyn::core::InitError;
use galvyn::core::Module;
use galvyn::core::PreInitError;
use galvyn::core::session::Id;
use tokio::sync::mpsc::Sender;
use tokio::sync::mpsc::UnboundedReceiver;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::mpsc::unbounded_channel;
use tokio::time::timeout;
use tracing::error;
use tracing::warn;

use crate::http::handler::websockets::schema::WsServerMsg;

pub mod broadcast_on_commit;

/// How long a client has to accept a broadcast before its connection is closed
const SEND_TIMEOUT: Duration = Duration::from_secs(5);

/// Represents the WebSocketManager struct, responsible for managing WebSocket connections.
///
/// This struct contains a sender for sending commands to worker state.
pub struct WebsocketManager {
    /// Sends commands to the [`WebsocketManagerState`] task
    ///
    /// This channel is unbounded so that every method on [`WebsocketManager`] can be sync,
    /// which is what lets them be called from a rorm `post_commit` transaction hook.
    sender: UnboundedSender<WebsocketManagerCommand>,
}

impl WebsocketManager {
    /// Registers a new session with the WebSocket manager.
    ///
    /// This function handles the registration process, sending a command to the
    /// WebSocket manager to establish a new session.
    pub fn register(&self, session: Id, sender: Sender<WsServerMsg>) {
        self.send(WebsocketManagerCommand::Register { session, sender })
    }

    /// Closes a WebSocket session.
    ///
    /// This function sends a WebSocket command to close the specified session.
    pub fn close_session(&self, session: Id) {
        self.send(WebsocketManagerCommand::CloseSession { session })
    }

    /// Sends a message to all connected clients via the WebsocketManager.
    ///
    /// This queues the message and returns immediately; it does not wait for the
    /// `WebsocketManager` to deliver it.
    pub fn send_to_all(&self, message: WsServerMsg) {
        self.send(WebsocketManagerCommand::SendToAll { message })
    }

    /// Sends a command to the websocket manager.
    ///
    /// This function attempts to send a given command using the `sender`.
    /// If the send operation fails (returns an error), it logs an error message indicating the websocket manager has died.
    fn send(&self, cmd: WebsocketManagerCommand) {
        if self.sender.send(cmd).is_err() {
            error!("Websocket manager died!");
        }
    }
}

impl Module for WebsocketManager {
    type Setup = ();
    type PreInit = ();

    async fn pre_init(_setup: Self::Setup) -> Result<Self::PreInit, PreInitError> {
        Ok(())
    }

    type Dependencies = ();

    async fn init(
        _pre_init: Self::PreInit,
        _dependencies: &mut Self::Dependencies,
    ) -> Result<Self, InitError> {
        let (sender, receiver) = unbounded_channel();

        tokio::spawn(
            WebsocketManagerState {
                receiver,
                sockets: Vec::new(),
            }
            .run(),
        );

        Ok(Self { sender })
    }
}

/// Commands processed by the [`WebsocketManagerState`] event loop.
enum WebsocketManagerCommand {
    /// Register a new WebSocket connection with the manager.
    Register {
        /// Channel used to push server messages to this client.
        sender: Sender<WsServerMsg>,
        /// Session identifier for this connection.
        session: Id,
    },
    /// Broadcast a message to every connected client.
    SendToAll {
        /// The message to deliver to all clients.
        message: WsServerMsg,
    },
    /// Remove a specific session and drop its sender.
    CloseSession {
        /// Session identifier to close.
        session: Id,
    },
}

/// Represents the state of a WebsocketManager.
///
/// This struct encapsulates the necessary parts for managing websockets,
/// including a channel for receiving commands and a list of connected sockets.
struct WebsocketManagerState {
    /// Channel to receive commands to execute
    receiver: UnboundedReceiver<WebsocketManagerCommand>,

    /// All connected websockets
    sockets: Vec<(Id, Sender<WsServerMsg>)>,
}

impl WebsocketManagerState {
    /// This function handles incoming WebSocket commands.
    /// It continuously receives commands from the `receiver` and processes them accordingly.
    pub async fn run(mut self) {
        while let Some(cmd) = self.receiver.recv().await {
            match cmd {
                WebsocketManagerCommand::Register { sender, session } => {
                    self.sockets.push((session, sender))
                }
                WebsocketManagerCommand::SendToAll { message } => {
                    // Send to all clients concurrently: one slow client must not delay the
                    // others, and the whole broadcast stays bounded by `SEND_TIMEOUT` rather
                    // than `SEND_TIMEOUT * clients`.
                    let dropped: Vec<Id> = join_all(self.sockets.iter().map(|(session, socket)| {
                        let message = message.clone();
                        async move {
                            match timeout(SEND_TIMEOUT, socket.send(message)).await {
                                Ok(Ok(())) => None,
                                // The receiving task is already gone
                                Ok(Err(_)) => Some(*session),
                                Err(_) => {
                                    warn!(
                                        session = ?session,
                                        "Client did not accept broadcast in time, closing connection"
                                    );
                                    Some(*session)
                                }
                            }
                        }
                    }))
                    .await
                    .into_iter()
                    .flatten()
                    .collect();

                    self.sockets.retain(|(session, socket)| {
                        !socket.is_closed() && !dropped.contains(session)
                    });
                }
                WebsocketManagerCommand::CloseSession { session } => {
                    self.sockets.retain(|(id, _)| *id != session)
                }
            }
        }
    }
}
