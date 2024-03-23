use crate::{
    repositories::ProposalRepositoryImpl,
    services::{DevService, DevServiceImpl},
};
use backend_api::{ApiError, ApiResult};
use ic_cdk::*;

#[update]
fn close_proposal(proposal_id: String) -> ApiResult<()> {
    DevController::default().close_proposal(proposal_id).into()
}

struct DevController<D: DevService> {
    proposal_service: D,
}

impl Default for DevController<DevServiceImpl<ProposalRepositoryImpl>> {
    fn default() -> Self {
        Self::new(DevServiceImpl::default())
    }
}

impl<P: DevService> DevController<P> {
    pub fn new(proposal_service: P) -> Self {
        Self { proposal_service }
    }

    pub fn close_proposal(&self, proposal_id: String) -> Result<(), ApiError> {
        self.proposal_service.complete_proposal(proposal_id)
    }
}
