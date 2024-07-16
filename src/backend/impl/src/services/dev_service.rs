use crate::{
    repositories::{DateTime, ProposalId, ProposalRepository, ProposalRepositoryImpl},
    system_api::get_date_time,
};
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
        let current_time = get_date_time().and_then(DateTime::new)?;
        self.proposal_repository
            .complete_proposal_by_id(ProposalId::try_from(proposal_id.as_str())?, current_time)
    }
}

impl<P: ProposalRepository> DevServiceImpl<P> {
    fn new(proposal_repository: P) -> Self {
        Self {
            proposal_repository,
        }
    }
}
