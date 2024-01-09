use backend_api::ApiError;
use candid::{
    types::{Serializer, Type, TypeInner},
    CandidType, Deserialize,
};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;
use uuid::{Builder, Uuid as UuidImpl};

use crate::system_api::with_random_bytes;

const UUID_SIZE: usize = 16;

#[derive(Debug, Deserialize, Clone, Copy, Default, Ord, PartialOrd, PartialEq, Eq)]
pub struct Uuid(UuidImpl);

impl Uuid {
    pub async fn new() -> Result<Self, ApiError> {
        with_random_bytes(|bytes: [u8; UUID_SIZE]| Self::from_random_bytes(bytes)).await
    }

    pub fn from_random_bytes(bytes: [u8; UUID_SIZE]) -> Self {
        Self(Builder::from_random_bytes(bytes).into_uuid())
    }
}

impl ToString for Uuid {
    fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl CandidType for Uuid {
    fn _ty() -> Type {
        TypeInner::Vec(TypeInner::Nat8.into()).into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_blob(self.0.as_bytes())
    }
}

impl Storable for Uuid {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Borrowed(self.0.as_bytes())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(UuidImpl::from_bytes(bytes.into_owned().try_into().unwrap()))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: UUID_SIZE as u32,
        is_fixed_size: true,
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    fn storable_impl() {
        let uuid = fixtures::uuid();

        let serialized_uuid = uuid.to_bytes();
        let deserialized_uuid = Uuid::from_bytes(serialized_uuid);

        assert_eq!(deserialized_uuid, uuid);
    }
}
