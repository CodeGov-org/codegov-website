use crate::system_api::get_date_time;

use super::{DateTime, Uuid};
use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_nns_governance::pb::v1::{ProposalInfo, ProposalStatus, Topic};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

pub type ProposalId = Uuid;
pub type ProposalIndex = (DateTime, ProposalId);
pub type NervousSystemProposalId = u64;
pub type NeuronId = u64;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NervousSystem {
    Network {
        id: NervousSystemProposalId,
        topic: NnsProposalTopic,
    },
}

impl NervousSystem {
    pub fn new_network(id: NervousSystemProposalId, topic: NnsProposalTopic) -> Self {
        Self::Network { id, topic }
    }

    pub fn id(&self) -> NervousSystemProposalId {
        match self {
            Self::Network { id, .. } => *id,
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NnsProposalTopic {
    ReplicaVersionManagement,
    SystemCanisterManagement,
}

impl TryFrom<Topic> for NnsProposalTopic {
    type Error = ApiError;

    fn try_from(topic: Topic) -> Result<Self, Self::Error> {
        match topic {
            Topic::ReplicaVersionManagement => Ok(NnsProposalTopic::ReplicaVersionManagement),
            Topic::NetworkCanisterManagement => Ok(NnsProposalTopic::SystemCanisterManagement),
            _ => Err(ApiError::internal(&format!("Invalid topic: {:?}", topic))),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodState {
    InProgress,
    Completed,
}

impl From<ProposalStatus> for ReviewPeriodState {
    fn from(status: ProposalStatus) -> Self {
        match status {
            ProposalStatus::Open => ReviewPeriodState::InProgress,
            _ => ReviewPeriodState::Completed,
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Proposal {
    pub title: String,
    pub nervous_system: NervousSystem,
    pub state: ReviewPeriodState,
    pub proposed_at: DateTime,
    pub proposed_by: NeuronId,
    pub synced_at: DateTime,
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

        let inner_proposal = nns_proposal
            .clone()
            .proposal
            .ok_or(ApiError::internal("Inner proposal is None"))?;

        let title = inner_proposal
            .title
            .unwrap_or_else(|| String::from("Title not available"));

        let topic = nns_proposal.topic().try_into()?;
        let nervous_system = NervousSystem::new_network(proposal_id, topic);

        let state = nns_proposal.status().into();

        let proposed_at =
            DateTime::from_timestamp_micros(nns_proposal.proposal_timestamp_seconds * 1_000_000)?;

        let proposed_by = nns_proposal
            .proposer
            .ok_or(ApiError::internal("Proposer is None"))?
            .id;

        // the NNS proposal is casted to our proposal when it is fetched
        // from the NNS, so here it's fine to set the synced_at time to now
        let date_time = get_date_time()?;

        Ok(Proposal {
            title,
            nervous_system,
            state,
            proposed_at,
            proposed_by,
            synced_at: DateTime::new(date_time)?,
            review_completed_at: None,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::nns_proposal(fixtures::nns_replica_version_management_proposal())]
    fn storable_impl(#[case] proposal: Proposal) {
        let serialized_proposal = proposal.to_bytes();
        let deserialized_proposal = Proposal::from_bytes(serialized_proposal);

        assert_eq!(proposal, deserialized_proposal);
    }
}
