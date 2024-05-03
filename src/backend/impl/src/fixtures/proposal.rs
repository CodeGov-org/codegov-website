use crate::{
    fixtures::date_time_a,
    repositories::{DateTime, NervousSystem, Proposal, ProposalId, ReviewPeriodState},
};
use ic_nns_governance::pb::v1::ProposalInfo;
use rstest::*;

use super::uuid;

#[fixture]
pub fn nns_replica_version_management_proposal(
    #[default(None)] proposed_at: Option<DateTime>,
) -> Proposal {
    Proposal {
        nervous_system: NervousSystem::Network {
            id: 127094,
            proposal_info: ProposalInfo {
                proposal_timestamp_seconds: proposed_at
                    .unwrap_or(date_time_a())
                    .timestamp_seconds(),
                ..ProposalInfo::default()
            },
        },
        state: ReviewPeriodState::InProgress,
        // in a real world scenario, synced_at should be after the proposed_at date
        synced_at: date_time_a(),
        review_completed_at: None,
    }
}

#[fixture]
pub fn nns_replica_version_management_proposal_completed() -> Proposal {
    Proposal {
        nervous_system: NervousSystem::Network {
            id: 127094,
            proposal_info: ProposalInfo {
                proposal_timestamp_seconds: date_time_a().timestamp_seconds(),
                ..ProposalInfo::default()
            },
        },
        state: ReviewPeriodState::Completed,
        // these dates don't reflect a real world scenario
        synced_at: date_time_a(),
        review_completed_at: Some(date_time_a()),
    }
}

#[fixture]
pub fn nns_proposals() -> Vec<Proposal> {
    vec![
        nns_replica_version_management_proposal(None),
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
