use rorm::Model;
use uuid::Uuid;

#[derive(Model, Clone, Debug)]
pub struct User {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique, max_length = 255)]
    pub mail: String,

    #[rorm(max_length = 255)]
    pub display_name: String,

    #[rorm(max_length = 1024)]
    pub password: String,
}
