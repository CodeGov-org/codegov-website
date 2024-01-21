use crate::{
    fixtures::date_time_a,
    repositories::{NervousSystem, NeuronId, Proposal, ProposalTopic, ReviewPeriodState},
};
use rstest::*;

#[fixture]
pub fn nns_proposer() -> NeuronId {
    40
}

#[fixture]
pub fn nns_replica_version_management_proposal() -> Proposal {
    Proposal {
        title: "Elect new IC/Replica revision".to_string(),
        topic: ProposalTopic::ReplicaVersionManagement,
        nervous_system: NervousSystem::Network { id: 127094 },
        state: ReviewPeriodState::InProgress,
        proposed_at: date_time_a(),
        proposed_by: nns_proposer(),
    }
}
