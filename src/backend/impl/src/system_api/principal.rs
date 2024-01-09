use backend_api::ApiError;
use candid::Principal;

pub fn assert_principal_not_anonymous(principal: &Principal) -> Result<(), ApiError> {
    if principal == &Principal::anonymous() {
        return Err(ApiError::unauthenticated());
    }

    Ok(())
}
