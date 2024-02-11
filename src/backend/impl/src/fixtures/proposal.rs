use crate::{
    fixtures::date_time_a,
    repositories::{
        NervousSystem, NeuronId, NnsProposalTopic, Proposal, ProposalId, ReviewPeriodState,
    },
};
use rstest::*;

use super::uuid;

#[fixture]
pub fn nns_proposer() -> NeuronId {
    40
}

#[fixture]
pub fn nns_replica_version_management_proposal() -> Proposal {
    Proposal {
        title: "Elect new IC/Replica revision".to_string(),
        nervous_system: NervousSystem::Network {
            id: 127094,
            topic: NnsProposalTopic::ReplicaVersionManagement,
        },
        state: ReviewPeriodState::InProgress,
        proposed_at: date_time_a(),
        proposed_by: nns_proposer(),
        // in a real world scenario, synced_at should be after the proposed_at date
        synced_at: date_time_a(),
        review_completed_at: None,
    }
}

#[fixture]
pub fn nns_replica_version_management_proposal_completed() -> Proposal {
    Proposal {
        title: "Elect new IC/Replica revision".to_string(),
        nervous_system: NervousSystem::Network {
            id: 127094,
            topic: NnsProposalTopic::ReplicaVersionManagement,
        },
        state: ReviewPeriodState::Completed,
        proposed_at: date_time_a(),
        proposed_by: nns_proposer(),
        // these dates don't reflect a real world scenario
        synced_at: date_time_a(),
        review_completed_at: Some(date_time_a()),
    }
}

#[fixture]
pub fn nns_proposals() -> Vec<Proposal> {
    vec![
        nns_replica_version_management_proposal(),
        nns_replica_version_management_proposal_completed(),
    ]
}

#[fixture]
pub fn nns_proposals_with_ids() -> Vec<(ProposalId, Proposal)> {
    nns_proposals()
        .into_iter()
        .map(|proposal| (uuid(), proposal))
        .collect()
}
