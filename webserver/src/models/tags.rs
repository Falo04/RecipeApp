use rorm::fields::types::MaxStr;
use rorm::Model;
use uuid::Uuid;

#[derive(Model)]
pub struct Tag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,
}
