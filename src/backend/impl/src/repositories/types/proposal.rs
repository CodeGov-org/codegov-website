use super::{DateTime, Uuid};
use crate::system_api::get_date_time;
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use chrono::Duration;
use ic_nns_governance::pb::v1::{ProposalInfo, ProposalStatus};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};
use std::{borrow::Cow, ops::RangeBounds};

pub type ProposalId = Uuid;
pub type NervousSystemProposalId = u64;
pub type NeuronId = u64;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum NervousSystem {
    Network {
        id: NervousSystemProposalId,
        proposal_info: ProposalInfo,
    },
}

impl NervousSystem {
    pub fn new_network(id: NervousSystemProposalId, proposal_info: ProposalInfo) -> Self {
        Self::Network { id, proposal_info }
    }

    pub fn id(&self) -> NervousSystemProposalId {
        match self {
            Self::Network { id, .. } => *id,
        }
    }
}

#[derive(Debug, Clone, Copy, CandidType, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
// We're explicit about the enum values here because they are serialized
// to u8 when the state is used as a key and we want to make sure that the
// values are stable.
#[repr(u8)]
pub enum ReviewPeriodState {
    InProgress = 1,
    Completed = 2,
}

impl From<ReviewPeriodState> for u8 {
    fn from(state: ReviewPeriodState) -> u8 {
        state as u8
    }
}

impl From<ProposalStatus> for ReviewPeriodState {
    fn from(status: ProposalStatus) -> Self {
        match status {
            ProposalStatus::Open => ReviewPeriodState::InProgress,
            _ => ReviewPeriodState::Completed,
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
    /// The timestamp of when the proposal's review period is completed.
    pub review_completed_at: Option<DateTime>,
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

impl TryFrom<ProposalInfo> for Proposal {
    type Error = ApiError;

    fn try_from(nns_proposal: ProposalInfo) -> Result<Self, Self::Error> {
        let proposal_id = nns_proposal
            .id
            .ok_or(ApiError::internal("Proposal id is None"))?
            .id;

        let nervous_system = NervousSystem::new_network(proposal_id, nns_proposal.clone());

        let state = nns_proposal.status().into();

        // the NNS proposal is casted to our proposal when it is fetched
        // from the NNS, so here it's fine to set the synced_at time to now
        let date_time = get_date_time()?;

        Ok(Proposal {
            nervous_system,
            state,
            synced_at: DateTime::new(date_time)?,
            review_completed_at: None,
        })
    }
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
        self.state == ReviewPeriodState::Completed
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

    pub fn new(state: u8, date_time: DateTime, proposal_id: ProposalId) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(((state, date_time), proposal_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                    "Failed to convert state {:?}, date time {:?} and proposal id {:?} to bytes.",
                    state, date_time, proposal_id
                ))
                },
            )?,
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
    pub fn new(state: Option<ReviewPeriodState>) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: ProposalStatusTimestampKey::new(
                state.map(Into::into).unwrap_or(u8::MIN),
                DateTime::min(),
                Uuid::MIN,
            )?,
            end_bound: ProposalStatusTimestampKey::new(
                state.map(Into::into).unwrap_or(u8::MAX),
                DateTime::max()?,
                Uuid::MAX,
            )?,
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal(None))]
    fn proposal_storable_impl(#[case] proposal: Proposal) {
        let serialized_proposal = proposal.to_bytes();
        let deserialized_proposal = Proposal::from_bytes(serialized_proposal);

        assert_eq!(proposal, deserialized_proposal);
    }

    #[rstest]
    fn proposal_status_timestamp_key_storable_impl() {
        let state = ReviewPeriodState::InProgress;
        let date_time = get_date_time().unwrap();
        let proposal_id = fixtures::proposal_id();

        let key = ProposalStatusTimestampKey::new(
            state.into(),
            DateTime::new(date_time).unwrap(),
            proposal_id,
        )
        .unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = ProposalStatusTimestampKey::from_bytes(serialized_key);

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

        let completed_proposal = fixtures::nns_replica_version_management_proposal_completed();

        assert!(!completed_proposal.is_pending(&current_time));
        assert!(completed_proposal.is_completed());
    }

    #[fixture]
    fn in_progress_proposals() -> Vec<Proposal> {
        let current_time = get_date_time().unwrap();

        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(12)).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(24)).unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(36)).unwrap(),
                ))
            },
        ]
    }

    #[fixture]
    fn pending_proposals() -> Vec<Proposal> {
        let current_time = get_date_time().unwrap();

        vec![
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(48) - Duration::minutes(1))
                        .unwrap(),
                ))
            },
            Proposal {
                state: ReviewPeriodState::InProgress,
                ..fixtures::nns_replica_version_management_proposal(Some(
                    DateTime::new(current_time - Duration::hours(60)).unwrap(),
                ))
            },
        ]
    }
}
