use crate::repositories::{ProposalId, ProposalRepository, ProposalRepositoryImpl};
use backend_api::ApiError;

pub trait DevService {
    fn complete_proposal(&self, proposal_id: String) -> Result<(), ApiError>;
}

pub struct DevServiceImpl<P: ProposalRepository> {
    proposal_repository: P,
}

impl Default for DevServiceImpl<ProposalRepositoryImpl> {
    fn default() -> Self {
        Self::new(ProposalRepositoryImpl::default())
    }
}

impl<P: ProposalRepository> DevService for DevServiceImpl<P> {
    fn complete_proposal(&self, proposal_id: String) -> Result<(), ApiError> {
        self.proposal_repository
            .complete_proposal_by_id(ProposalId::try_from(proposal_id.as_str())?)
    }
}

impl<P: ProposalRepository> DevServiceImpl<P> {
    fn new(proposal_repository: P) -> Self {
        Self {
            proposal_repository,
        }
    }
}
