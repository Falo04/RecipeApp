//! Manages websockets and handles commands.
use galvyn::core::InitError;
use galvyn::core::Module;
use galvyn::core::PreInitError;
use tokio::sync::mpsc::channel;
use tokio::sync::mpsc::Receiver;
use tokio::sync::mpsc::Sender;
use tower_sessions::session::Id;
use tracing::error;

use crate::http::handler::websockets::schema::WsServerMsg;

/// Represents the WebSocketManager struct, responsible for managing WebSocket connections.
///
/// This struct contains a sender for sending commands to worker state.
pub struct WebsocketManager {
    /// An instance of `Sender<WebsocketManagerCommand>` used to send commands
    sender: Sender<WebsocketManagerCommand>,
}

impl WebsocketManager {
    /// Registers a new session with the WebSocket manager.
    ///
    /// This function handles the registration process, sending a command to the
    /// WebSocket manager to establish a new session.
    pub async fn register(&self, session: Id, sender: Sender<WsServerMsg>) {
        self.send(WebsocketManagerCommand::Register { session, sender })
            .await
    }

    /// Closes a WebSocket session.
    ///
    /// This function sends a WebSocket command to close the specified session.
    pub async fn close_session(&self, session: Id) {
        self.send(WebsocketManagerCommand::CloseSession { session })
            .await
    }

    /// Sends a message to all connected clients via the WebsocketManager.
    ///
    /// This function takes a `WsServerMsg` and forwards it to the `WebsocketManager`
    /// using the `SendToAll` command.  The operation is asynchronous, waiting
    /// for the `WebsocketManager` to complete the message sending.
    pub async fn send_to_all(&self, message: WsServerMsg) {
        self.send(WebsocketManagerCommand::SendToAll { message })
            .await
    }

    /// Sends a command to the websocket manager.
    ///
    /// This function attempts to send a given command using the `sender`.
    /// If the send operation fails (returns an error), it logs an error message indicating the websocket manager has died.
    async fn send(&self, cmd: WebsocketManagerCommand) {
        if self.sender.send(cmd).await.is_err() {
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
        let (sender, receiver) = channel(1);

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

/// Represents a command for the WebsocketManager.
///
/// This enum defines the different actions that can be performed by the WebsocketManager.
/// Each variant represents a specific command with the required data.
enum WebsocketManagerCommand {
    Register {
        sender: Sender<WsServerMsg>,
        session: Id,
    },
    SendToAll {
        message: WsServerMsg,
    },
    CloseSession {
        session: Id,
    },
}

/// Represents the state of a WebsocketManager.
///
/// This struct encapsulates the necessary parts for managing websockets,
/// including a channel for receiving commands and a list of connected sockets.
struct WebsocketManagerState {
    /// Channel to receive commands to execute
    receiver: Receiver<WebsocketManagerCommand>,

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
                    for (_, socket) in self.sockets.iter_mut() {
                        let _ = socket.send(message.clone()).await;
                    }
                    self.sockets.retain(|(_, socket)| !socket.is_closed());
                }
                WebsocketManagerCommand::CloseSession { session } => {
                    self.sockets.retain(|(id, _)| *id != session)
                }
            }
        }
    }
}
