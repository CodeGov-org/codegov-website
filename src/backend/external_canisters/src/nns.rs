use candid::Principal;
use ic_cdk::{api::call::RejectionCode, call};
use ic_nns_governance::pb::v1::*;

type CanisterResult<T> = Result<T, (RejectionCode, String)>;

pub struct GovernanceCanisterService(pub Principal);

impl GovernanceCanisterService {
    pub async fn list_proposals(
        &self,
        arg0: ListProposalInfo,
    ) -> CanisterResult<(ListProposalInfoResponse,)> {
        call(self.0, "list_proposals", (arg0,)).await
    }
}
