use galvyn::core::re_exports::rorm;

pub mod ingredients;
pub mod recipes;
pub mod tags;
pub mod user;

/// New type for `Result<T, rorm::Error>`
pub type DatabaseResult<T> = Result<T, rorm::Error>;
