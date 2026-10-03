//! Extends [`Transaction`] with the ability to broadcast a websocket message on commit

use galvyn::core::Module;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::db::transaction::TransactionHook;
use tracing::error;

use crate::http::handler::websockets::schema::WsServerMsg;
use crate::modules::websocket::WebsocketManager;

/// Broadcasts accumulated during a transaction, sent once it commits successfully
#[derive(Default)]
struct BroadcastHook {
    /// The distinct messages to broadcast, in registration order
    messages: Vec<WsServerMsg>,
}

impl TransactionHook for BroadcastHook {
    fn post_commit(&mut self) {
        match WebsocketManager::try_global() {
            Ok(manager) => {
                for message in self.messages.drain(..) {
                    manager.send_to_all(message);
                }
            }
            Err(error) => {
                error!(
                    error.display = %error,
                    "Websocket manager unavailable, dropping broadcasts"
                );
            }
        }
    }
}

/// Extends [`Transaction`] with the ability to broadcast a websocket message on commit
pub trait BroadcastOnCommit {
    /// Broadcasts `message` to all connected clients once this transaction commits successfully
    ///
    /// Nothing is sent if the transaction is rolled back or dropped. Registering the same
    /// message more than once on one transaction still sends it only once.
    fn broadcast_on_commit(&mut self, message: WsServerMsg) -> &mut Self;
}

impl BroadcastOnCommit for Transaction {
    fn broadcast_on_commit(&mut self, message: WsServerMsg) -> &mut Self {
        {
            let mut hooks = self.adv_hooks();
            let hook = hooks.get_or_insert_default::<BroadcastHook>();
            if !hook.messages.contains(&message) {
                hook.messages.push(message);
            }
        }
        self
    }
}
