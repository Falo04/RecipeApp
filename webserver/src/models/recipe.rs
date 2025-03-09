use rorm::fields::types::MaxStr;
use rorm::Model;
use uuid::Uuid;

#[derive(Model)]
pub struct Recipe {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
}
