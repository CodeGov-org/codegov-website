use backend_api::ApiError;
use candid::{
    types::{Type, TypeInner},
    CandidType, Deserialize,
};
use chrono::{Datelike, NaiveDateTime, TimeZone, Timelike, Utc};
use ic_stable_structures::{storable::Bound, Storable};
use std::{borrow::Cow, str::FromStr};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct DateTime(chrono::DateTime<chrono::Utc>);

const DATE_TIME_SIZE: u32 = 25;

impl DateTime {
    pub fn new(date_time: chrono::DateTime<chrono::Utc>) -> Result<Self, ApiError> {
        Ok(Self(date_time.with_nanosecond(0).ok_or(
            ApiError::internal(&format!("Failed to convert date time {:?}", date_time)),
        )?))
    }

    pub fn from_timestamp_micros(micros: u64) -> Result<Self, ApiError> {
        let created_at = NaiveDateTime::from_timestamp_micros(micros.try_into().unwrap()).unwrap();
        Self::new(Utc.from_utc_datetime(&created_at))
    }

    pub fn min() -> Self {
        Self(chrono::DateTime::<chrono::Utc>::UNIX_EPOCH)
    }

    pub fn max() -> Result<Self, ApiError> {
        Ok(Self(
            chrono::DateTime::<chrono::Utc>::MAX_UTC
                .with_year(9999)
                .ok_or_else(|| ApiError::internal("Failed to create max date time."))?,
        ))
    }
}

impl ToString for DateTime {
    fn to_string(&self) -> String {
        self.0.to_rfc3339_opts(chrono::SecondsFormat::Secs, false)
    }
}

impl CandidType for DateTime {
    fn _ty() -> Type {
        TypeInner::Text.into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: candid::types::Serializer,
    {
        self.to_string().idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for DateTime {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        String::deserialize(deserializer)
            .and_then(|date_time| {
                chrono::DateTime::parse_from_rfc3339(&date_time)
                    .map_err(|_| serde::de::Error::custom("Invalid date time."))
            })
            .map(|date_time| Self(date_time.into()))
    }
}

impl Storable for DateTime {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(self.to_string().as_bytes().to_vec())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(chrono::DateTime::from_str(&String::from_utf8(bytes.into_owned()).unwrap()).unwrap())
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: DATE_TIME_SIZE,
        is_fixed_size: true,
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case(fixtures::date_time_a())]
    #[case(fixtures::date_time_b())]
    #[case(fixtures::date_time_c())]
    fn storable_impl_admin(#[case] date_time: DateTime) {
        let serialized_date_time = date_time.to_bytes();
        let deserialized_date_time = DateTime::from_bytes(serialized_date_time);

        assert_eq!(date_time, deserialized_date_time);
    }
}
