use std::borrow::Cow;

use backend_api::ApiError;
use candid::{
    types::{Serializer, Type, TypeInner},
    CandidType, Deserialize,
};
use hex::FromHex;
use ic_stable_structures::{storable::Bound, Storable};

const COMMIT_SHA_SIZE: usize = 20;

type CommitShaInner = [u8; COMMIT_SHA_SIZE];

#[derive(Debug, Clone, Copy, Default, Ord, PartialOrd, PartialEq, Eq)]
pub struct CommitSha(CommitShaInner);

impl CommitSha {
    const MIN: CommitSha = CommitSha([0; COMMIT_SHA_SIZE]);
    const MAX: CommitSha = CommitSha([255; COMMIT_SHA_SIZE]);

    pub fn new(bytes: CommitShaInner) -> Self {
        Self(bytes)
    }

    pub fn min() -> Self {
        Self::MIN
    }

    pub fn max() -> Self {
        Self::MAX
    }
}

impl TryFrom<&str> for CommitSha {
    type Error = ApiError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.len() != COMMIT_SHA_SIZE * 2 {
            return Err(ApiError::internal(&format!(
                "Invalid commit sha length: {}",
                value.len()
            )));
        }

        let bytes = CommitShaInner::from_hex(value)
            .map_err(|e| ApiError::internal(&format!("Failed to decode commit sha: {:?}", e)))?;

        Ok(Self(bytes))
    }
}

impl TryFrom<Vec<u8>> for CommitSha {
    type Error = ApiError;

    fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
        if value.len() != COMMIT_SHA_SIZE {
            return Err(ApiError::internal(&format!(
                "Invalid commit sha length: {}",
                value.len()
            )));
        }

        Ok(Self(value.try_into().unwrap()))
    }
}

impl ToString for CommitSha {
    fn to_string(&self) -> String {
        hex::encode(self.0)
    }
}

impl CandidType for CommitSha {
    fn _ty() -> Type {
        TypeInner::Vec(TypeInner::Nat8.into()).into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: Serializer,
    {
        self.0.idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for CommitSha {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Vec::<u8>::deserialize(deserializer).and_then(|bytes| {
            CommitSha::try_from(bytes).map_err(|_| serde::de::Error::custom("Invalid commit sha."))
        })
    }
}

impl Storable for CommitSha {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(&self.0)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(bytes.into_owned().try_into().unwrap())
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: COMMIT_SHA_SIZE as u32,
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
        let commit_sha = fixtures::commit_sha_a();

        let serialized_commit_sha = commit_sha.to_bytes();
        let deserialized_commit_sha = CommitSha::from_bytes(serialized_commit_sha);

        assert_eq!(deserialized_commit_sha, commit_sha);
    }

    #[rstest]
    fn try_from() {
        let commit_sha = fixtures::commit_sha_a();

        let str_result = CommitSha::try_from(commit_sha.to_string().as_str()).unwrap();
        assert_eq!(str_result, commit_sha);

        let vec_result = CommitSha::try_from(hex::decode(commit_sha.to_string()).unwrap()).unwrap();
        assert_eq!(vec_result, commit_sha);
    }

    #[rstest]
    fn try_from_invalid() {
        let commit_sha_str = "not a commit sha";
        let result_str = CommitSha::try_from(commit_sha_str).unwrap_err();
        assert_eq!(
            result_str,
            ApiError::internal(&format!(
                "Invalid commit sha length: {}",
                commit_sha_str.len()
            ))
        );

        let commit_sha_str = "foo bar foo bar foo bar foo bar foo bar "; // valid length but invalid hex
        let result_str = CommitSha::try_from(commit_sha_str).unwrap_err();
        assert!(result_str
            .message()
            .starts_with("Failed to decode commit sha: "));

        let commit_sha_vec = vec![1, 2, 3, 4];
        let result_vec = CommitSha::try_from(commit_sha_vec.clone()).unwrap_err();
        assert_eq!(
            result_vec,
            ApiError::internal(&format!(
                "Invalid commit sha length: {}",
                commit_sha_vec.len()
            ))
        );

        let short_commit_sha = "28111ed2";
        let result_short = CommitSha::try_from(short_commit_sha).unwrap_err();
        assert_eq!(
            result_short,
            ApiError::internal(&format!(
                "Invalid commit sha length: {}",
                short_commit_sha.len()
            ))
        )
    }
}
