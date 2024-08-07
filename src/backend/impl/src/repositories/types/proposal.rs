use super::{DateTime, Uuid};
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use chrono::Duration;
use ic_nns_governance::pb::v1::ProposalInfo;
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};
use std::{borrow::Cow, ops::RangeBounds};

pub type ProposalId = Uuid;
pub type NervousSystemProposalId = u64;
pub type NeuronId = u64;
/// The internal Nervous System identifier.
///
/// Practically, to get the identifier of the nervous system that you need, you can use the [NervousSystem] enum:
///
/// ```rust
/// let nervous_system_id = NervousSystem::NNS_ID;
/// assert_eq!(nervous_system_id, 0);
/// ```
pub type NervousSystemId = u64;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum NervousSystem {
    Network {
        proposal_id: NervousSystemProposalId,
        proposal_info: ProposalInfo,
    },
}

impl NervousSystem {
    pub const NNS_ID: NervousSystemId = 0;
    // add new nervous system ids here, for example:
    // const OPEN_CHAT_ID: NervousSystemId = 1;
}

impl NervousSystem {
    pub fn new_network(proposal_id: NervousSystemProposalId, proposal_info: ProposalInfo) -> Self {
        Self::Network {
            proposal_id,
            proposal_info,
        }
    }

    pub fn proposal_id(&self) -> NervousSystemProposalId {
        match self {
            Self::Network { proposal_id, .. } => *proposal_id,
        }
    }

    /// Returns the id of the nervous system that the proposal belongs to.
    ///
    /// This id is not related with the Nervous Systems at all.
    /// It's just decided by us and mainly used for grouping the the proposals
    /// in the [ProposalNervousSystemIdKey] index key.
    pub fn nervous_system_id(&self) -> NervousSystemId {
        match self {
            Self::Network { .. } => Self::NNS_ID,
        }
    }
}

impl TryFrom<ProposalInfo> for NervousSystem {
    type Error = ApiError;

    fn try_from(nns_proposal: ProposalInfo) -> Result<Self, Self::Error> {
        let proposal_id = nns_proposal
            .id
            .ok_or(ApiError::internal(
                "Failed to map NNS proposal: Proposal id is None",
            ))?
            .id;

        Ok(NervousSystem::new_network(
            proposal_id,
            nns_proposal.clone(),
        ))
    }
}

#[derive(Debug, Clone, Copy, CandidType, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
// We're explicit about the enum values here because they are serialized
// to u8 when the state is used as a key and we want to make sure that the
// values are stable.
#[repr(u8)]
pub enum ReviewPeriodStateKey {
    InProgress = 1,
    Completed = 2,
}

impl From<ReviewPeriodStateKey> for u8 {
    fn from(state: ReviewPeriodStateKey) -> u8 {
        state as u8
    }
}

#[derive(Debug, Clone, Copy, CandidType, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ReviewPeriodState {
    InProgress,
    Completed { completed_at: DateTime },
}

impl From<ReviewPeriodState> for ReviewPeriodStateKey {
    fn from(state: ReviewPeriodState) -> Self {
        match state {
            ReviewPeriodState::InProgress => Self::InProgress,
            ReviewPeriodState::Completed { .. } => Self::Completed,
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct Proposal {
    /// The Nervous System that the proposal belongs to.
    pub nervous_system: NervousSystem,
    /// The internal state of the proposal's review period.
    pub state: ReviewPeriodState,
    /// The timestamp of when the proposal was fetched from the Nervous System.
    pub synced_at: DateTime,
}

impl Storable for Proposal {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Proposal {
    /// Checks if the proposal is in [ReviewPeriodState::InProgress] state
    /// and was proposed more than **48 hours** ago.
    pub fn is_pending(&self, current_time: &DateTime) -> bool {
        self.state == ReviewPeriodState::InProgress
            && self.proposed_at().unwrap() <= current_time.sub(Duration::hours(48))
    }

    /// Checks if the proposal is in [ReviewPeriodState::Completed] state.
    pub fn is_completed(&self) -> bool {
        matches!(&self.state, ReviewPeriodState::Completed { .. })
    }

    pub fn proposed_at(&self) -> Result<DateTime, ApiError> {
        let proposal_timestamp_seconds = match &self.nervous_system {
            NervousSystem::Network { proposal_info, .. } => {
                proposal_info.proposal_timestamp_seconds
            }
        };

        DateTime::from_timestamp_micros(proposal_timestamp_seconds * 1_000_000)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalStatusTimestampKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalStatusTimestampKey {
    const MAX_SIZE: u32 = <((u8, DateTime), ProposalId)>::BOUND.max_size();

    pub fn new(
        state: ReviewPeriodStateKey,
        date_time: DateTime,
        proposal_id: ProposalId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(
                ((u8::from(state), date_time), proposal_id)
                    .to_bytes()
                    .as_ref(),
            )
            .map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert state {:?}, date time {:?} and proposal id {:?} to bytes.",
                    state, date_time, proposal_id
                ))
            })?,
        ))
    }
}

impl Storable for ProposalStatusTimestampKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct ProposalStatusTimestampRange {
    start_bound: ProposalStatusTimestampKey,
    end_bound: ProposalStatusTimestampKey,
}

impl ProposalStatusTimestampRange {
    pub fn new(state: ReviewPeriodStateKey) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalStatusTimestampKey::new(state, DateTime::min(), Uuid::MIN)?,
            end_bound: ProposalStatusTimestampKey::new(state, DateTime::max()?, Uuid::MAX)?,
        })
    }
}

impl RangeBounds<ProposalStatusTimestampKey> for ProposalStatusTimestampRange {
    fn start_bound(&self) -> std::ops::Bound<&ProposalStatusTimestampKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalStatusTimestampKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalNervousSystemIdKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalNervousSystemIdKey {
    const MAX_SIZE: u32 =
        <((NervousSystemId, NervousSystemProposalId), ProposalId)>::BOUND.max_size();

    pub fn new(
        nervous_system_id: NervousSystemId,
        nervous_system_proposal_id: NervousSystemProposalId,
        proposal_id: ProposalId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(
                ((nervous_system_id, nervous_system_proposal_id), proposal_id)
                    .to_bytes()
                    .as_ref(),
            )
            .map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert nervous system id {:?}, nervous system proposal id {:?} and proposal id {:?} to bytes.",
                    nervous_system_id, nervous_system_proposal_id, proposal_id
                ))
            })?,
        ))
    }
}

impl Storable for ProposalNervousSystemIdKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct ProposalNervousSystemIdRange {
    start_bound: ProposalNervousSystemIdKey,
    end_bound: ProposalNervousSystemIdKey,
}

impl ProposalNervousSystemIdRange {
    pub fn new(
        nervous_system_id: NervousSystemId,
        nervous_system_proposal_id: NervousSystemProposalId,
    ) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalNervousSystemIdKey::new(
                nervous_system_id,
                nervous_system_proposal_id,
                Uuid::MIN,
            )?,
            end_bound: ProposalNervousSystemIdKey::new(
                nervous_system_id,
                nervous_system_proposal_id,
                Uuid::MAX,
            )?,
        })
    }
}

impl RangeBounds<ProposalNervousSystemIdKey> for ProposalNervousSystemIdRange {
    fn start_bound(&self) -> std::ops::Bound<&ProposalNervousSystemIdKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalNervousSystemIdKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct ProposalTimestampKey(Blob<{ Self::MAX_SIZE as usize }>);

impl ProposalTimestampKey {
    const MAX_SIZE: u32 = <(DateTime, ProposalId)>::BOUND.max_size();

    pub fn new(date_time: DateTime, proposal_id: ProposalId) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((date_time, proposal_id).to_bytes().as_ref()).map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert date time {:?} and proposal id {:?} to bytes.",
                    date_time, proposal_id
                ))
            })?,
        ))
    }
}

impl Storable for ProposalTimestampKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct ProposalTimestampRange {
    start_bound: ProposalTimestampKey,
    end_bound: ProposalTimestampKey,
}

impl ProposalTimestampRange {
    pub fn new() -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalTimestampKey::new(DateTime::min(), Uuid::MIN)?,
            end_bound: ProposalTimestampKey::new(DateTime::max()?, Uuid::MAX)?,
        })
    }
}

impl RangeBounds<ProposalTimestampKey> for ProposalTimestampRange {
    fn start_bound(&self) -> std::ops::Bound<&ProposalTimestampKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&ProposalTimestampKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{fixtures, system_api::get_date_time};
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal(None, None))]
    fn proposal_storable_impl(#[case] proposal: Proposal) {
        let serialized_proposal = proposal.to_bytes();
        let deserialized_proposal = Proposal::from_bytes(serialized_proposal);

        assert_eq!(proposal, deserialized_proposal);
    }

    #[rstest]
    fn proposal_status_timestamp_key_storable_impl() {
        let state = ReviewPeriodStateKey::InProgress;
        let date_time = get_date_time().unwrap();
        let proposal_id = fixtures::proposal_id();

        let key =
            ProposalStatusTimestampKey::new(state, DateTime::new(date_time).unwrap(), proposal_id)
                .unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalStatusTimestampKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn proposal_nervous_system_id_key_storable_impl() {
        let nervous_system =
            fixtures::nns_replica_version_management_proposal(None, None).nervous_system;
        let proposal_id = fixtures::proposal_id();

        let key = ProposalNervousSystemIdKey::new(
            nervous_system.nervous_system_id(),
            nervous_system.proposal_id(),
            proposal_id,
        )
        .unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalNervousSystemIdKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn proposal_timestamp_key_storable_impl() {
        let date_time = get_date_time().unwrap();
        let proposal_id = fixtures::proposal_id();

        let key =
            ProposalTimestampKey::new(DateTime::new(date_time).unwrap(), proposal_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalTimestampKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn proposal_is_pending_and_is_completed() {
        let current_time = DateTime::new(get_date_time().unwrap()).unwrap();
        let in_progress_proposals = in_progress_proposals();
        let pending_proposals = pending_proposals();

        for proposal in in_progress_proposals {
            assert!(!proposal.is_pending(&current_time));
            assert!(!proposal.is_completed());
        }

        for proposal in pending_proposals {
            assert!(proposal.is_pending(&current_time));
            assert!(!proposal.is_completed());
        }

        let completed_proposal =
            fixtures::nns_replica_version_management_proposal_completed(None, None);

        assert!(!completed_proposal.is_pending(&current_time));
        assert!(completed_proposal.is_completed());
    }

    #[fixture]
    fn in_progress_proposals() -> Vec<Proposal> {
        let current_time = get_date_time().unwrap();

        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time).unwrap()),
                    None,
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(12)).unwrap()),
                    None,
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(24)).unwrap()),
                    None,
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(36)).unwrap()),
                    None,
                )
            },
        ]
    }

    #[fixture]
    fn pending_proposals() -> Vec<Proposal> {
        let current_time = get_date_time().unwrap();

        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(
                        DateTime::new(current_time - Duration::hours(48) - Duration::minutes(1))
                            .unwrap(),
                    ),
                    None,
                )
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(
                    Some(DateTime::new(current_time - Duration::hours(60)).unwrap()),
                    None,
                )
            },
        ]
    }
}
