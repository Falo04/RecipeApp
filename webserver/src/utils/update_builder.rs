//! Update builder which keeps a business model in sync with the database
//!
//! # Example
//! ```ignore
//! /// Database model
//! #[derive(Model)]
//! pub struct SomeModel {
//!     #[rorm(primary_key)]
//!     pub uuid: Uuid,
//!     #[rorm(max_length(255))]
//!     pub name: String,
//!     pub age: i64,
//! }
//!
//! /// Business model
//! pub struct SomeEntity {
//!     pub uuid: Uuid,
//!     pub name: String,
//!     pub age: i64,
//! }
//!
//! impl SomeEntity {
//!     pub async fn update(
//!         &mut self, tx:
//!         &mut Transaction,
//!         params: UpdateParams
//!     ) -> Result<(), rorm::Error> {
//!         let Some(builder) = TrackedUpdateBuilder::new(tx)
//!             .set(SomeModel.name, &mut self.name, params.name)
//!             .set_if_some(SomeModel.age, &mut self.age, params.age)
//!             .finish()
//!         else {
//!             return Ok(());
//!         }
//!
//!         builder.condition(SomeModel.uuid.equals(self.uuid))
//!             .await?;
//!         Ok(())
//!     }
//! }
//! ```
//!
//! # Caveat
//! the business model is updated immediately on each `set_if_some`
//! not when the query is executed. If the query fails, the business model
//! already contains the new values.
use galvyn::core::re_exports::rorm;
use galvyn::rorm::Model;
use galvyn::rorm::crud::selector::Selector;
use galvyn::rorm::crud::update::UpdateBuilder;
use galvyn::rorm::crud::update::columns;
use galvyn::rorm::db::Executor;
use galvyn::rorm::fields::proxy::FieldProxy;
use galvyn::rorm::fields::proxy::FieldProxyImpl;
use galvyn::rorm::internal::field::Field;
use galvyn::rorm::internal::field::SingleColumnField;

/// Builder for update queries writes every set value into a business model as well
///
/// Wraps rorm's [`UpdateBuilder`] in its "dynamic" mode and any number of fields
/// can be set. Call [`fisnis`](Self::finish) to get the actual query builder back.
pub struct TrackedUpdateBuilder<'rf, E, M: Model> {
    inner: UpdateBuilder<'rf, E, M, columns::MaybeEmpty>,
}

impl<'rf, E, M> TrackedUpdateBuilder<'rf, E, M>
where
    M: Model,
{
    /// Starts an update query on some model (M) table.
    ///
    /// Equivalent to `rorm::update(exe, M).begin_dyn_set()`.
    pub fn new<'e>(exe: E) -> Self
    where
        E: Executor<'e>,
        M::ValueSpaceImpl: Selector<Model = M>,
    {
        Self {
            inner: rorm::update(exe, M::ValueSpaceImpl::default()).begin_dyn_set(),
        }
    }

    /// Set `field` to `value` in the query and write `value` into `target`    
    ///
    /// `T` is the business model's type, which may differ from the database field's type
    /// as long as it can be converted using [`Into`]. If both type are equal, this is
    /// always the case.
    pub fn set<I, T>(mut self, field: FieldProxy<I>, target: &mut T, value: T) -> Self
    where
        I: FieldProxyImpl<Field: SingleColumnField, Path = M>,
        T: Clone + Into<<I::Field as Field>::Type>,
    {
        *target = value.clone();
        self.inner = self.inner.set(field, value.into());
        self
    }

    /// Set `field` to `value` in the query and write `value` into `target`, but does
    /// nothing if `value` is `None`.
    ///
    /// `T` is the business model's type, which may differ from the database field's type
    /// as long as it can be converted using [`Into`]. If both type are equal, this is
    /// always the case.
    pub fn set_if_some<I, T>(self, field: FieldProxy<I>, target: &mut T, value: Option<T>) -> Self
    where
        I: FieldProxyImpl<Field: SingleColumnField, Path = M>,
        T: Clone + Into<<I::Field as Field>::Type>,
    {
        match value {
            Some(v) => self.set(field, target, v),
            None => self,
        }
    }

    /// Finish the setting fields and get the query builder to add a condition and execute it.
    ///
    /// Returns `None` if no field has been set, because there is nothing to update.
    /// In this case the business model hasn't been changed either.
    pub fn finish(self) -> Option<UpdateBuilder<'rf, E, M, columns::NonEmpty>> {
        let Ok(builder) = self.inner.finish_dyn_set() else {
            return None;
        };
        Some(builder)
    }
}
