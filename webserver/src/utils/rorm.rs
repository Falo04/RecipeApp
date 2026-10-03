//! Utils function for rorm

#[cfg(debug_assertions)]
use std::error::Error;

#[cfg(debug_assertions)]
use galvyn::rorm;
use galvyn::rorm::DatabaseDriver;
use galvyn::rorm::config::DatabaseConfig;

/// The migration dir
pub const MIGRATION_DIR: &str = "/migrations";

/// Generate new migration into the [MIGRATION_DIR]
#[cfg(debug_assertions)]
pub fn make_migrations(migration_dir: String) -> Result<(), Box<dyn Error>> {
    use std::io::Write;

    /// Temporary file to store models in
    const MODELS: &str = "/tmp/.models.json";

    let mut file = std::fs::File::create(MODELS)?;
    rorm::write_models(&mut file)?;
    file.flush()?;

    rorm::cli::make_migrations::run_make_migrations(
        rorm::cli::make_migrations::MakeMigrationsOptions {
            models_file: MODELS.to_string(),
            migration_dir,
            name: None,
            non_interactive: false,
            warnings_disabled: false,
        },
    )?;

    std::fs::remove_file(MODELS)?;
    Ok(())
}

/// Applies all migration from [MIGRATION_DIR] to the database
pub async fn migrate(driver: &DatabaseDriver) -> Result<(), Box<dyn Error>> {
    rorm::cli::migrate::run_migrate_custom(
        DatabaseConfig {
            driver: driver.clone(),
            last_migration_table_name: None,
        },
        MIGRATION_DIR.to_owned(),
        None,
    )
    .await?;
    Ok(())
}

/// Implements [`FieldType`](galvyn::rorm::fields::traits::FieldType) for a fieldless enum,
/// storing it as its variant's name in a single `varchar` column.
///
/// This is the string-valued counterpart to rorm's `DbEnum` derive, which stores the variants
/// in a `choices` column instead. The column's `max_length` defaults to 255, so it does not have
/// to be annotated on the model (an explicit `#[rorm(max_length)]` still wins).
///
/// The enum gains inherent `as_db_str`/`from_db_str` methods and can be compared against both
/// itself and `&str` in query conditions.
///
/// # Usage
/// ```ignore
/// #[derive(Debug, Copy, Clone)]
/// pub enum ScalingRule {
///     /// Scales with the serving count
///     Linear,
///     /// Stays put
///     Fixed,
/// }
///
/// custom_db_enum!(
///     enum: ScalingRule,
///     variants: [Linear, Fixed],
///     decoder: ScalingRuleDecoder,
/// );
/// ```
#[macro_export]
macro_rules! custom_db_enum{
    (enum: $Enum:ident, variants: [$($Variant:ident),+$(,)?], decoder: $Decoder:ident$(,)?) => (
        impl $Enum {
            pub fn as_str(&self) -> &'static str {
                match self {
                    $(Self::$Variant => stringify!($Variant),)+
                }
            }

            pub fn from_str(string: &str) -> Option<Self> {
                Some(match string {
                    $(stringify!($Variant) => Self::$Variant,)+
                    _ => return None,
                })
            }
        }

        impl galvyn::rorm::fields::traits::FieldType for $Enum {
            type Columns = galvyn::rorm::fields::traits::Array<1>;

            const NULL: galvyn::rorm::fields::traits::FieldColumns<Self, galvyn::rorm::db::sql::value::NullType> =
                [galvyn::rorm::db::sql::value::NullType::String];

            fn into_values<'a>(
                self,
            ) -> galvyn::rorm::fields::traits::FieldColumns<Self, galvyn::rorm::conditions::Value<'a>> {
                [::galvyn::rorm::conditions::Value::String(
                    ::std::borrow::Cow::Borrowed(self.as_str()),
                )]
            }

            fn as_values(
                    &self,
                ) -> ::galvyn::rorm::fields::traits::FieldColumns<
                    Self,
                    ::galvyn::rorm::conditions::Value<'_>,
                > {
                    [::galvyn::rorm::conditions::Value::String(
                        ::std::borrow::Cow::Borrowed(self.as_str()),
                    )]
                }

            type Decoder = $Decoder;

            type GetNames = <String as galvyn::rorm::fields::traits::FieldType>::GetNames;

            type GetAnnotations = <String as galvyn::rorm::fields::traits::FieldType>::GetAnnotations;

            type Check = <String as galvyn::rorm::fields::traits::FieldType>::Check;
        }

        ::galvyn::rorm::new_converting_decoder!(
            pub $Decoder,
            |value: String| -> $Enum {
                $Enum::from_str(&value).ok_or(format!("Invalid value '{value}' for enum '{}'", stringify!($Enum)),)
            }
        );

        impl galvyn::rorm::fields::traits::simple::SimpleFieldEq for $Enum {}

        impl galvyn::rorm::fields::traits::simple::SimpleFieldLike for $Enum {}
    )
}
