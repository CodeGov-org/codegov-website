use super::{DateTime, Uuid};
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

pub type ProposalId = Uuid;
pub type NervousSystemProposalId = u64;
pub type NeuronId = u64;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum NervousSystem {
    Network { id: NervousSystemProposalId },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ProposalTopic {
    ReplicaVersionManagement,
    SystemCanisterManagement,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum ReviewPeriodState {
    InProgress,
    Completed,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct Proposal {
    pub title: String,
    pub topic: ProposalTopic,
    pub nervous_system: NervousSystem,
    pub state: ReviewPeriodState,
    pub proposed_at: DateTime,
    pub proposed_by: NeuronId,
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
