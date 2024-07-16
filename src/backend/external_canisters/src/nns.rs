use candid::Principal;
use ic_cdk::{api::call::RejectionCode, call};
use ic_nns_governance::pb::v1::*;

type CanisterResult<T> = Result<T, (RejectionCode, String)>;

pub struct GovernanceCanisterService(pub Principal);

impl GovernanceCanisterService {
    pub async fn list_proposals(
        &self,
        arg0: ListProposalInfo,
    ) -> CanisterResult<ListProposalInfoResponse> {
        let (res,) = call(self.0, "list_proposals", (arg0,)).await?;
        Ok(res)
    }

    pub async fn get_proposal_info(&self, arg0: u64) -> CanisterResult<Option<ProposalInfo>> {
        let (res,) = call(self.0, "get_proposal_info", (arg0,)).await?;
        Ok(res)
    }
}
