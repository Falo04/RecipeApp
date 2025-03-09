use std::ops::Deref;
use std::sync::OnceLock;

use rorm::Database;

pub static GLOBAL: GlobalOnceCell<GlobalChan> = GlobalOnceCell::new();
pub type DB = Database;

pub struct GlobalChan {
    pub db: DB,
    pub jwt: String,
}

pub struct GlobalOnceCell<T>(OnceLock<T>);
impl<T> GlobalOnceCell<T> {
    pub const fn new() -> Self {
        Self(OnceLock::new())
    }

    // pub fn is_initalized(&self) -> bool {
    //     self.0.get().is_some()
    // }

    pub fn init(&self, value: T) {
        self.0
            .set(value)
            .ok()
            .expect("`GlobalLock.init` has been called twice")
    }
}

impl<T> Deref for GlobalOnceCell<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        self.0
            .get()
            .expect("`GlobalLock.init` has not been called yet")
    }
}
