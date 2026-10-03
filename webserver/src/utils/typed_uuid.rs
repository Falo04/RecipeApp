//! Zero-cost phantom-typed wrapper around [`Uuid`] that prevents mixing IDs from different domain
//! types at compile time.
//!
//! ```ignore
//! type OrderId = TypedUuid<Order>;
//!
//! let id = OrderId::now_v7();
//! println!("{id}");
//! ```

use std::borrow::Cow;
use std::cmp::Ordering;
use std::fmt;
use std::hash::Hash;
use std::hash::Hasher;
use std::marker::PhantomData;
use std::str::FromStr;

use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::schemars::SchemaGenerator;
use galvyn::core::re_exports::schemars::schema::Schema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

/// Zero-cost phantom-typed wrapper around [`Uuid`] that prevents mixing IDs from different domain
/// types at compile time.
///
/// ```ignore
/// type OrderId = TypedUuid<Order>;
/// type CustomerId = TypedUuid<Customer>;
///
/// let order = OrderId::now_v7();
/// let customer = CustomerId::now_v7();
/// ```
#[derive(Serialize, Deserialize)]
#[serde(transparent)]
pub struct TypedUuid<T> {
    /// Inner [`Uuid`] which is wrapped by [`TypedUuid`]
    uuid: Uuid,
    /// Marker for the tag type
    #[serde(skip)]
    _phantom: PhantomData<fn() -> T>,
}

impl<T> TypedUuid<T> {
    /// The nil UUID, i.e. all bits set to zero
    pub const NIL: Self = Self::new(Uuid::nil());

    /// Wraps an existing [`Uuid`] in the typed wrapper
    pub const fn new(uuid: Uuid) -> Self {
        Self {
            uuid,
            _phantom: PhantomData,
        }
    }

    /// Generates a new time-ordered v7 UUID and wraps it
    pub fn now_v7() -> Self {
        Self::new(Uuid::now_v7())
    }

    /// Returns the inner [`Uuid`], discarding the tag
    pub fn into_inner(self) -> Uuid {
        self.uuid
    }
}

impl<T> From<Uuid> for TypedUuid<T> {
    fn from(uuid: Uuid) -> Self {
        Self::new(uuid)
    }
}

impl<T> From<TypedUuid<T>> for Uuid {
    fn from(id: TypedUuid<T>) -> Self {
        id.uuid
    }
}

impl<T> FromStr for TypedUuid<T> {
    type Err = uuid::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Uuid::from_str(s).map(Self::new)
    }
}

impl<T> Copy for TypedUuid<T> {}

impl<T> Clone for TypedUuid<T> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T> PartialEq for TypedUuid<T> {
    fn eq(&self, other: &Self) -> bool {
        self.uuid == other.uuid
    }
}

impl<T> Eq for TypedUuid<T> {}

impl<T> PartialOrd for TypedUuid<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl<T> Ord for TypedUuid<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.uuid.cmp(&other.uuid)
    }
}

impl<T> Hash for TypedUuid<T> {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.uuid.hash(state);
    }
}

impl<T> fmt::Display for TypedUuid<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.uuid, f)
    }
}

impl<T> fmt::Debug for TypedUuid<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "TypedUuid({})", self.uuid)
    }
}

impl<T> JsonSchema for TypedUuid<T> {
    fn is_referenceable() -> bool {
        Uuid::is_referenceable()
    }

    fn schema_name() -> String {
        Uuid::schema_name()
    }

    fn schema_id() -> Cow<'static, str> {
        Uuid::schema_id()
    }

    fn json_schema(sg: &mut SchemaGenerator) -> Schema {
        Uuid::json_schema(sg)
    }
}
