use crate::{
    helpers::create_image_http_response,
    mappings::map_proposal_review,
    repositories::{
        CertificationRepository, CertificationRepositoryImpl, CreateImageRequest, DateTime, Image,
        ImageRepository, ImageRepositoryImpl, ProposalId, ProposalRepository,
        ProposalRepositoryImpl, ProposalReview, ProposalReviewCommitRepository,
        ProposalReviewCommitRepositoryImpl, ProposalReviewId, ProposalReviewRepository,
        ProposalReviewRepositoryImpl, ProposalReviewStatus, ProposalVote, UserId,
        UserProfileRepository, UserProfileRepositoryImpl,
    },
    system_api::get_date_time,
};
use backend_api::{
    ApiError, CreateProposalReviewImageRequest, CreateProposalReviewImageResponse,
    CreateProposalReviewRequest, CreateProposalReviewResponse, DeleteProposalReviewImageRequest,
    GetMyProposalReviewRequest, GetMyProposalReviewResponse, GetProposalReviewRequest,
    GetProposalReviewResponse, ListProposalReviewsRequest, ListProposalReviewsResponse,
    UpdateProposalReviewRequest,
};
use candid::Principal;
use std::{path::PathBuf, str::FromStr};

const MAX_PROPOSAL_REVIEW_SUMMARY_CHARS: usize = 1500;
const MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS: u16 = 60 * 3; // 3 hours

const PROPOSAL_REVIEW_IMAGES_SUB_PATH: &str = "reviews";

#[cfg_attr(test, mockall::automock)]
pub trait ProposalReviewService {
    async fn create_proposal_review(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewRequest,
    ) -> Result<CreateProposalReviewResponse, ApiError>;

    fn update_proposal_review(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewRequest,
    ) -> Result<(), ApiError>;

    fn list_proposal_reviews(
        &self,
        calling_principal: Principal,
        request: ListProposalReviewsRequest,
    ) -> Result<ListProposalReviewsResponse, ApiError>;

    fn get_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetProposalReviewRequest,
    ) -> Result<GetProposalReviewResponse, ApiError>;

    async fn create_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewImageRequest,
    ) -> Result<CreateProposalReviewImageResponse, ApiError>;

    fn delete_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewImageRequest,
    ) -> Result<(), ApiError>;

    fn get_my_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetMyProposalReviewRequest,
    ) -> Result<GetMyProposalReviewResponse, ApiError>;
}

pub struct ProposalReviewServiceImpl<
    PR: ProposalReviewRepository,
    U: UserProfileRepository,
    P: ProposalRepository,
    PRC: ProposalReviewCommitRepository,
    I: ImageRepository,
    C: CertificationRepository,
> {
    proposal_review_repository: PR,
    user_profile_repository: U,
    proposal_repository: P,
    proposal_review_commit_repository: PRC,
    image_repository: I,
    certification_repository: C,
}

impl Default
    for ProposalReviewServiceImpl<
        ProposalReviewRepositoryImpl,
        UserProfileRepositoryImpl,
        ProposalRepositoryImpl,
        ProposalReviewCommitRepositoryImpl,
        ImageRepositoryImpl,
        CertificationRepositoryImpl,
    >
{
    fn default() -> Self {
        Self::new(
            ProposalReviewRepositoryImpl::default(),
            UserProfileRepositoryImpl::default(),
            ProposalRepositoryImpl::default(),
            ProposalReviewCommitRepositoryImpl::default(),
            ImageRepositoryImpl::default(),
            CertificationRepositoryImpl::default(),
        )
    }
}

impl<
        PR: ProposalReviewRepository,
        U: UserProfileRepository,
        P: ProposalRepository,
        PRC: ProposalReviewCommitRepository,
        I: ImageRepository,
        C: CertificationRepository,
    > ProposalReviewService for ProposalReviewServiceImpl<PR, U, P, PRC, I, C>
{
    async fn create_proposal_review(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewRequest,
    ) -> Result<CreateProposalReviewResponse, ApiError> {
        self.validate_fields(request.summary.as_ref(), request.review_duration_mins)?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let proposal_id = ProposalId::try_from(request.proposal_id.as_str())?;

        match self.proposal_repository.get_proposal_by_id(&proposal_id) {
            Some(proposal) => {
                if proposal.is_completed() {
                    return Err(ApiError::conflict(&format!(
                        "Proposal with Id {} is already completed",
                        proposal_id.to_string()
                    )));
                }
            }
            None => {
                return Err(ApiError::not_found(&format!(
                    "Proposal with Id {} not found",
                    request.proposal_id
                )))
            }
        }

        if self
            .proposal_review_repository
            .get_proposal_review_by_proposal_id_and_user_id(proposal_id, user_id)
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "User with Id {} has already submitted a review for proposal with Id {}",
                user_id.to_string(),
                proposal_id.to_string()
            )));
        }

        let date_time = get_date_time()?;

        let proposal_review = ProposalReview {
            proposal_id,
            user_id,
            status: ProposalReviewStatus::Draft,
            created_at: DateTime::new(date_time)?,
            last_updated_at: None,
            summary: request.summary,
            review_duration_mins: request.review_duration_mins,
            build_reproduced: request.build_reproduced,
            images_ids: vec![],
            vote: request
                .vote
                .map_or(ProposalVote::Unspecified, |vote| vote.into()),
        };

        let id = self
            .proposal_review_repository
            .create_proposal_review(proposal_review.clone())
            .await?;

        Ok(map_proposal_review(id, proposal_review, vec![], vec![]))
    }

    fn update_proposal_review(
        &self,
        calling_principal: Principal,
        request: UpdateProposalReviewRequest,
    ) -> Result<(), ApiError> {
        self.validate_fields(request.summary.as_ref(), request.review_duration_mins)?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let (id, mut current_proposal_review) = self.get_current_proposal_review(
            request.proposal_id,
            user_id,
            request.status.as_ref(),
        )?;

        if request.summary.is_some() {
            current_proposal_review.summary = request.summary;
        }
        if request.review_duration_mins.is_some() {
            current_proposal_review.review_duration_mins = request.review_duration_mins;
        }
        if request.build_reproduced.is_some() {
            current_proposal_review.build_reproduced = request.build_reproduced;
        }
        if request.vote.is_some() {
            current_proposal_review.vote = request.vote.unwrap().into();
        }

        if let Some(status) = request.status {
            if status == backend_api::ProposalReviewStatus::Published {
                // validate the fields again since it won't be possible to update them anymore
                // unless the review is set back to draft
                self.validate_published_fields(
                    current_proposal_review.summary.as_ref(),
                    current_proposal_review.review_duration_mins,
                    current_proposal_review.build_reproduced,
                )
                .map_err(|e| {
                    ApiError::conflict(&format!(
                        "Proposal review cannot be published due to invalid field: {}",
                        e.message()
                    ))
                })?;
            }

            current_proposal_review.status = status.into();
        }

        self.save_proposal_review(id, current_proposal_review)
    }

    fn list_proposal_reviews(
        &self,
        calling_principal: Principal,
        request: ListProposalReviewsRequest,
    ) -> Result<ListProposalReviewsResponse, ApiError> {
        let calling_user = self
            .user_profile_repository
            .get_user_profile_by_principal(&calling_principal);

        // match filters
        let proposal_reviews = match (request.proposal_id, request.user_id) {
            (Some(proposal_id), None) => {
                let proposal_id = ProposalId::try_from(proposal_id.as_str())?;

                self.proposal_review_repository
                    .get_proposal_reviews_by_proposal_id(proposal_id)
            }
            (None, Some(user_id)) => {
                let user_id = UserId::try_from(user_id.as_str())?;

                self.proposal_review_repository
                    .get_proposal_reviews_by_user_id(user_id)
            }
            (Some(_), Some(_)) => Err(ApiError::invalid_argument(
                "Cannot specify both proposal_id and user_id parameters",
            )),
            (None, None) => Err(ApiError::invalid_argument(
                "Must specify either proposal_id or user_id parameter",
            )),
        }?;

        // map and filter by status and owner
        let proposal_reviews = proposal_reviews
            .iter()
            .filter_map(|(proposal_review_id, proposal_review)| {
                // if the proposal review is in draft, only allow the owner and admins to see it
                if proposal_review.is_draft()
                    && !calling_user
                        .as_ref()
                        .is_some_and(|(user_id, user_profile)| {
                            user_id == &proposal_review.user_id || user_profile.is_admin()
                        })
                {
                    return None;
                }

                self.map_proposal_review(*proposal_review_id, proposal_review.clone())
                    .ok()
            })
            .collect();

        Ok(ListProposalReviewsResponse { proposal_reviews })
    }

    fn get_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetProposalReviewRequest,
    ) -> Result<GetProposalReviewResponse, ApiError> {
        let calling_user = self
            .user_profile_repository
            .get_user_profile_by_principal(&calling_principal);

        let proposal_review_id = ProposalReviewId::try_from(request.proposal_review_id.as_str())?;

        let proposal_review = self
            .proposal_review_repository
            .get_proposal_review_by_id(&proposal_review_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Proposal review with Id {} not found",
                    request.proposal_review_id
                ))
            })?;

        // if the proposal review is in draft, only allow the owner and admins to see it
        if proposal_review.is_draft()
            && !calling_user.is_some_and(|(user_id, user_profile)| {
                user_id == proposal_review.user_id || user_profile.is_admin()
            })
        {
            return Err(ApiError::permission_denied("Not authorized"));
        }

        self.map_proposal_review(proposal_review_id, proposal_review)
    }

    async fn create_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: CreateProposalReviewImageRequest,
    ) -> Result<CreateProposalReviewImageResponse, ApiError> {
        request.validate_fields()?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let (id, mut current_proposal_review) =
            self.get_current_proposal_review(request.proposal_id.clone(), user_id, None)?;

        // for now, we only allow one image
        if !current_proposal_review.images_ids.is_empty() {
            return Err(ApiError::conflict(&format!(
                "Proposal review for proposal with Id {} already has an image",
                request.proposal_id
            )));
        }

        let sub_path = PathBuf::from_str(PROPOSAL_REVIEW_IMAGES_SUB_PATH).unwrap();

        let date_time = get_date_time()?;

        let image = Image {
            created_at: DateTime::new(date_time)?,
            user_id,
            content_type: request.content_type(),
            sub_path: Some(sub_path),
            content_bytes: request.content_bytes(),
        };

        let image_id = self.image_repository.create_image(image.clone()).await?;

        // certify the image response
        let image_http_request_path = image.path(&image_id);
        let image_http_response = create_image_http_response(&image);
        self.certification_repository
            .certify_http_response(&image_http_request_path, &image_http_response);

        current_proposal_review.images_ids = vec![image_id];

        self.save_proposal_review(id, current_proposal_review)?;

        Ok(CreateProposalReviewImageResponse {
            path: image.path(&image_id),
        })
    }

    fn delete_proposal_review_image(
        &self,
        calling_principal: Principal,
        request: DeleteProposalReviewImageRequest,
    ) -> Result<(), ApiError> {
        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let (id, mut current_proposal_review) =
            self.get_current_proposal_review(request.proposal_id.clone(), user_id, None)?;

        let image_id_to_delete = PathBuf::from(request.image_path.clone())
            .iter()
            .last()
            .ok_or_else(|| ApiError::invalid_argument("Invalid image path"))?
            .to_string_lossy()
            .to_string();

        if let Some(existing_image_id_idx) = current_proposal_review
            .images_ids
            .iter()
            .position(|image_id| image_id.to_string() == image_id_to_delete)
        {
            let existing_image_id = current_proposal_review
                .images_ids
                .remove(existing_image_id_idx);
            let deleted_image = self.image_repository.delete_image(&existing_image_id)?;

            let image_http_request_path = deleted_image.path(&existing_image_id);
            let image_http_response = create_image_http_response(&deleted_image);
            self.certification_repository
                .remove_http_response_certificate(&image_http_request_path, &image_http_response);
        } else {
            return Err(ApiError::not_found(&format!(
                "Image with path {} not found in proposal review for proposal with Id {}",
                request.image_path, request.proposal_id
            )));
        }

        self.save_proposal_review(id, current_proposal_review)?;

        Ok(())
    }

    fn get_my_proposal_review(
        &self,
        calling_principal: Principal,
        request: GetMyProposalReviewRequest,
    ) -> Result<GetMyProposalReviewResponse, ApiError> {
        let proposal_id = ProposalId::try_from(request.proposal_id.as_str())?;

        let user_id = self
            .user_profile_repository
            .get_user_id_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let (proposal_review_id, proposal_review) = self
            .proposal_review_repository
            .get_proposal_review_by_proposal_id_and_user_id(proposal_id, user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Proposal review for proposal {} for principal {} not found",
                    request.proposal_id,
                    calling_principal.to_text()
                ))
            })?;

        let response = self.map_proposal_review(proposal_review_id, proposal_review)?;

        Ok(response)
    }
}

impl<
        PR: ProposalReviewRepository,
        U: UserProfileRepository,
        P: ProposalRepository,
        PRC: ProposalReviewCommitRepository,
        I: ImageRepository,
        C: CertificationRepository,
    > ProposalReviewServiceImpl<PR, U, P, PRC, I, C>
{
    fn new(
        proposal_review_repository: PR,
        user_profile_repository: U,
        proposal_repository: P,
        proposal_review_commit_repository: PRC,
        image_repository: I,
        certification_repository: C,
    ) -> Self {
        Self {
            proposal_review_repository,
            user_profile_repository,
            proposal_repository,
            proposal_review_commit_repository,
            image_repository,
            certification_repository,
        }
    }

    fn validate_fields(
        &self,
        summary: Option<&String>,
        review_duration_mins: Option<u16>,
    ) -> Result<(), ApiError> {
        if let Some(summary) = summary {
            if summary.is_empty() {
                return Err(ApiError::invalid_argument("Summary cannot be empty"));
            }

            if summary.chars().count() > MAX_PROPOSAL_REVIEW_SUMMARY_CHARS {
                return Err(ApiError::invalid_argument(&format!(
                    "Summary must be less than {} characters",
                    MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
                )));
            }
        }

        if let Some(review_duration_mins) = review_duration_mins {
            if review_duration_mins == 0 {
                return Err(ApiError::invalid_argument("Review duration cannot be 0"));
            }

            if review_duration_mins > MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS {
                return Err(ApiError::invalid_argument(&format!(
                    "Review duration must be less than {} minutes",
                    MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
                )));
            }
        }

        Ok(())
    }

    fn get_current_proposal_review(
        &self,
        raw_proposal_id: String,
        user_id: UserId,
        request_status: Option<&backend_api::ProposalReviewStatus>,
    ) -> Result<(ProposalReviewId, ProposalReview), ApiError> {
        let proposal_id = ProposalId::try_from(raw_proposal_id.as_str())?;
        let (id, current_proposal_review) = self
            .proposal_review_repository
            .get_proposal_review_by_proposal_id_and_user_id(proposal_id, user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Proposal review for proposal with Id {} not found",
                    raw_proposal_id
                ))
            })?;

        if current_proposal_review.is_published()
            && !request_status.is_some_and(|s| s == &backend_api::ProposalReviewStatus::Draft)
        {
            return Err(ApiError::conflict(&format!(
                "Proposal review for proposal with Id {} is already published",
                raw_proposal_id
            )));
        }

        match self.proposal_repository.get_proposal_by_id(&proposal_id) {
            Some(proposal) => {
                if proposal.is_completed() {
                    return Err(ApiError::conflict(
                        "The proposal associated with this review is already completed",
                    ));
                }
            }
            None => {
                // this should never happen
                return Err(ApiError::not_found(&format!(
                    "Proposal with Id {} not found",
                    proposal_id.to_string()
                )));
            }
        }

        Ok((id, current_proposal_review))
    }

    fn map_proposal_review(
        &self,
        id: ProposalReviewId,
        proposal_review: ProposalReview,
    ) -> Result<backend_api::ProposalReviewWithId, ApiError> {
        let proposal_review_commits = self
            .proposal_review_commit_repository
            .get_proposal_review_commits_by_proposal_review_id(id)?;

        let images_paths = proposal_review
            .images_ids
            .iter()
            .filter_map(|image_id| {
                // the None case should never happen
                self.image_repository
                    .get_image_by_id(image_id)
                    .map(|image| image.path(image_id))
            })
            .collect();

        Ok(map_proposal_review(
            id,
            proposal_review,
            proposal_review_commits,
            images_paths,
        ))
    }

    fn save_proposal_review(
        &self,
        id: ProposalReviewId,
        mut proposal_review: ProposalReview,
    ) -> Result<(), ApiError> {
        let date_time = get_date_time()?;

        proposal_review.last_updated_at = Some(DateTime::new(date_time)?);
        self.proposal_review_repository
            .update_proposal_review(id, proposal_review)
    }

    fn validate_published_fields(
        &self,
        summary: Option<&String>,
        review_duration_mins: Option<u16>,
        build_reproduced: Option<bool>,
    ) -> Result<(), ApiError> {
        if summary.is_none() {
            return Err(ApiError::invalid_argument("Summary cannot be empty"));
        }

        if review_duration_mins.is_none() {
            return Err(ApiError::invalid_argument(
                "Review duration cannot be empty",
            ));
        }

        if build_reproduced.is_none() {
            return Err(ApiError::invalid_argument(
                "Build reproduced cannot be empty",
            ));
        }

        self.validate_fields(summary, review_duration_mins)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        fixtures,
        repositories::{
            ImageId, MockCertificationRepository, MockImageRepository, MockProposalRepository,
            MockProposalReviewCommitRepository, MockProposalReviewRepository,
            MockUserProfileRepository, ProposalReviewId, IMAGES_BASE_PATH,
        },
    };
    use backend_api::{
        CreateProposalReviewImageRequest, CreateProposalReviewImageResponse,
        DeleteProposalReviewImageRequest,
    };
    use mockall::predicate::*;
    use rstest::*;

    #[rstest]
    #[case::empty(proposal_review_create_empty())]
    #[case::full(proposal_review_create())]
    async fn create_proposal_review(
        #[case] fixture: (ProposalReview, CreateProposalReviewRequest),
    ) {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (proposal_review, request) = fixture;
        let proposal_id = ProposalId::try_from(request.proposal_id.as_str()).unwrap();
        let id = fixtures::proposal_review_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(proposal_id), eq(user_id))
            .return_const(None);
        pr_repository_mock
            .expect_create_proposal_review()
            .once()
            .with(eq(proposal_review.clone()))
            .return_const(Ok(id));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(
            result,
            CreateProposalReviewResponse {
                id: id.to_string(),
                proposal_review: proposal_review.into(),
            }
        );
    }

    #[rstest]
    #[case::summary_empty(proposal_review_create_summary_empty())]
    #[case::summary_too_long(proposal_review_create_summary_too_long())]
    #[case::review_duration_zero(proposal_review_create_review_duration_zero())]
    #[case::review_duration_too_long(proposal_review_create_review_duration_too_long())]
    async fn create_proposal_review_invalid(
        #[case] fixture: (CreateProposalReviewRequest, ApiError),
    ) {
        let calling_principal = fixtures::principal();
        let (request, api_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_create_proposal_review().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(result, api_error);
    }

    #[rstest]
    async fn create_proposal_review_no_user() {
        let calling_principal = fixtures::principal();
        let (_, request) = proposal_review_create();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_create_proposal_review().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User id for principal {} not found",
                calling_principal.to_text()
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_no_proposal() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (_, request) = proposal_review_create();
        let proposal_id = ProposalId::try_from(request.proposal_id.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_create_proposal_review().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request.clone())
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal with Id {} not found",
                request.proposal_id
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_proposal_already_completed() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (_, request) = proposal_review_create();
        let proposal_id = ProposalId::try_from(request.proposal_id.as_str()).unwrap();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(
                fixtures::nns_replica_version_management_proposal_completed(None, None),
            ));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_create_proposal_review().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request)
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal with Id {} is already completed",
                proposal_id.to_string()
            ))
        );
    }

    #[rstest]
    async fn create_proposal_review_already_created() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::user_id();
        let (_, request) = proposal_review_create();
        let proposal_id = ProposalId::try_from(request.proposal_id.as_str()).unwrap();
        let id = fixtures::proposal_review_id();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(proposal_id), eq(user_id))
            .return_const(Some((id, fixtures::proposal_review_draft())));
        pr_repository_mock.expect_create_proposal_review().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review(calling_principal, request.clone())
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "User with Id {} has already submitted a review for proposal with Id {}",
                user_id.to_string(),
                request.proposal_id
            ))
        );
    }

    #[fixture]
    fn proposal_review_create() -> (ProposalReview, CreateProposalReviewRequest) {
        let date_time = get_date_time().unwrap();
        let proposal_review = ProposalReview {
            created_at: DateTime::new(date_time).unwrap(),
            ..fixtures::proposal_review_draft()
        };

        (
            proposal_review.clone(),
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: proposal_review.summary.clone(),
                review_duration_mins: proposal_review.review_duration_mins,
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
        )
    }

    #[fixture]
    fn proposal_review_create_empty() -> (ProposalReview, CreateProposalReviewRequest) {
        let date_time = get_date_time().unwrap();
        let proposal_review = ProposalReview {
            created_at: DateTime::new(date_time).unwrap(),
            summary: None,
            review_duration_mins: None,
            build_reproduced: None,
            ..fixtures::proposal_review_draft()
        };

        (
            proposal_review.clone(),
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: proposal_review.summary,
                review_duration_mins: proposal_review.review_duration_mins,
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
        )
    }

    #[fixture]
    fn proposal_review_create_summary_empty() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some("".to_string()),
                review_duration_mins: proposal_review.review_duration_mins,
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
            ApiError::invalid_argument("Summary cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_create_summary_too_long() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: Some("a".repeat(MAX_PROPOSAL_REVIEW_SUMMARY_CHARS + 1)),
                review_duration_mins: proposal_review.review_duration_mins,
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
            ApiError::invalid_argument(&format!(
                "Summary must be less than {} characters",
                MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
            )),
        )
    }

    #[fixture]
    fn proposal_review_create_review_duration_zero() -> (CreateProposalReviewRequest, ApiError) {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: proposal_review.summary,
                review_duration_mins: Some(0),
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
            ApiError::invalid_argument("Review duration cannot be 0"),
        )
    }

    #[fixture]
    fn proposal_review_create_review_duration_too_long() -> (CreateProposalReviewRequest, ApiError)
    {
        let proposal_review = fixtures::proposal_review_draft();

        (
            CreateProposalReviewRequest {
                proposal_id: proposal_review.proposal_id.to_string(),
                summary: proposal_review.summary,
                review_duration_mins: Some(MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS + 1),
                build_reproduced: proposal_review.build_reproduced,
                vote: Some(proposal_review.vote.into()),
            },
            ApiError::invalid_argument(&format!(
                "Review duration must be less than {} minutes",
                MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
            )),
        )
    }

    #[rstest]
    #[case::update(proposal_review_update())]
    #[case::publish(proposal_review_update_publish())]
    fn update_proposal_review(
        #[case] fixture: (
            ProposalReviewId,
            ProposalReview,
            UpdateProposalReviewRequest,
            ProposalReview,
        ),
    ) {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, updated_proposal_review) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock
            .expect_update_proposal_review()
            .once()
            .with(eq(id), eq(updated_proposal_review.clone()))
            .return_const(Ok(()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        service
            .update_proposal_review(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    fn update_proposal_review_no_user() {
        let calling_principal = fixtures::principal();
        let (_, _, request, _) = proposal_review_update();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(None);
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "User id for principal {} not found",
                calling_principal.to_text()
            ))
        )
    }

    #[rstest]
    fn update_proposal_review_not_found() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (_, original_proposal_review, request, _) = proposal_review_update();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(None);
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Proposal review for proposal with Id {} not found",
                request.proposal_id
            ))
        )
    }

    #[rstest]
    fn update_proposal_review_proposal_already_completed() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, _) = proposal_review_update();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(
                fixtures::nns_replica_version_management_proposal_completed(None, None),
            ));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request)
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict("The proposal associated with this review is already completed")
        );
    }

    #[rstest]
    #[case::update(proposal_review_update())]
    #[case::publish(proposal_review_update_publish())]
    fn update_proposal_review_already_published(
        #[case] fixture: (
            ProposalReviewId,
            ProposalReview,
            UpdateProposalReviewRequest,
            ProposalReview,
        ),
    ) {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, _) = fixture;

        let original_proposal_review = ProposalReview {
            status: ProposalReviewStatus::Published,
            ..original_proposal_review
        };

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review)));
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal review for proposal with Id {} is already published",
                request.proposal_id
            ))
        )
    }

    #[rstest]
    fn update_proposal_review_already_published_to_draft() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, updated_proposal_review) =
            proposal_review_update_draft();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock
            .expect_update_proposal_review()
            .once()
            .with(eq(id), eq(updated_proposal_review.clone()))
            .return_const(Ok(()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        service
            .update_proposal_review(calling_principal, request.clone())
            .unwrap();
    }

    #[rstest]
    #[case::summary_empty(proposal_review_update_summary_empty())]
    #[case::summary_too_long(proposal_review_update_summary_too_long())]
    #[case::review_duration_zero(proposal_review_update_duration_zero())]
    #[case::review_duration_too_long(proposal_review_update_duration_too_long())]
    fn proposal_review_update_invalid(#[case] fixture: (UpdateProposalReviewRequest, ApiError)) {
        let calling_principal = fixtures::principal();
        let (request, expected_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock.expect_get_user_id_by_principal().never();
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .never();
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock.expect_get_proposal_by_id().never();
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(result, expected_error)
    }

    #[rstest]
    #[case::summary_empty(proposal_review_update_publish_summary_empty())]
    #[case::summary_too_long(proposal_review_update_publish_summary_too_long())]
    #[case::review_duration_zero(proposal_review_update_publish_duration_zero())]
    #[case::no_summary(proposal_review_update_publish_duration_too_long())]
    #[case::no_duration(proposal_review_update_publish_no_duration())]
    #[case::no_build_reproduced(proposal_review_update_publish_no_build_reproduced())]
    fn proposal_review_update_publish_invalid(
        #[case] fixture: (
            ProposalReviewId,
            ProposalReview,
            UpdateProposalReviewRequest,
            ApiError,
        ),
    ) {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, expected_error) = fixture;

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let image_repository_mock = MockImageRepository::new();
        let certification_repository_mock = MockCertificationRepository::new();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .update_proposal_review(calling_principal, request)
            .unwrap_err();

        assert_eq!(result, expected_error)
    }

    #[fixture]
    fn proposal_review_update() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ProposalReview,
    ) {
        let id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            ..fixtures::proposal_review_draft()
        };
        let summary = "Updated summary".to_string();
        let review_duration_mins = 120;
        let build_reproduced = false;

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: None,
                summary: Some(summary.clone()),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                vote: Some(backend_api::ProposalVote::Yes),
            },
            ProposalReview {
                summary: Some(summary),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                vote: ProposalVote::Yes,
                ..original_proposal_review
            },
        )
    }

    #[fixture]
    fn proposal_review_update_draft() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ProposalReview,
    ) {
        let id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            ..fixtures::proposal_review_published()
        };
        let status = ProposalReviewStatus::Draft;
        let summary = "Updated summary".to_string();
        let review_duration_mins = 120;
        let build_reproduced = false;
        let vote = ProposalVote::No;

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(status.clone().into()),
                summary: Some(summary.clone()),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                vote: Some(vote.clone().into()),
            },
            ProposalReview {
                status,
                summary: Some(summary),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                vote,
                ..original_proposal_review
            },
        )
    }

    #[fixture]
    fn proposal_review_update_publish() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ProposalReview,
    ) {
        let id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            ..fixtures::proposal_review_draft()
        };
        let status = ProposalReviewStatus::Published;
        let summary = "Updated summary".to_string();
        let review_duration_mins = 120;
        let build_reproduced = false;

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(status.clone().into()),
                summary: Some(summary.clone()),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                vote: None,
            },
            ProposalReview {
                status,
                summary: Some(summary),
                review_duration_mins: Some(review_duration_mins),
                build_reproduced: Some(build_reproduced),
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                ..original_proposal_review
            },
        )
    }

    #[fixture]
    fn proposal_review_update_summary_empty() -> (UpdateProposalReviewRequest, ApiError) {
        (
            UpdateProposalReviewRequest {
                proposal_id: fixtures::proposal_id().to_string(),
                status: None,
                summary: Some("".to_string()),
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::invalid_argument("Summary cannot be empty"),
        )
    }

    #[fixture]
    fn proposal_review_update_summary_too_long() -> (UpdateProposalReviewRequest, ApiError) {
        (
            UpdateProposalReviewRequest {
                proposal_id: fixtures::proposal_id().to_string(),
                status: None,
                summary: Some("a".repeat(MAX_PROPOSAL_REVIEW_SUMMARY_CHARS + 1)),
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::invalid_argument(&format!(
                "Summary must be less than {} characters",
                MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
            )),
        )
    }

    #[fixture]
    fn proposal_review_update_duration_zero() -> (UpdateProposalReviewRequest, ApiError) {
        (
            UpdateProposalReviewRequest {
                proposal_id: fixtures::proposal_id().to_string(),
                status: None,
                summary: None,
                review_duration_mins: Some(0),
                build_reproduced: None,
                vote: None,
            },
            ApiError::invalid_argument("Review duration cannot be 0"),
        )
    }

    #[fixture]
    fn proposal_review_update_duration_too_long() -> (UpdateProposalReviewRequest, ApiError) {
        (
            UpdateProposalReviewRequest {
                proposal_id: fixtures::proposal_id().to_string(),
                status: None,
                summary: None,
                review_duration_mins: Some(MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS + 1),
                build_reproduced: None,
                vote: None,
            },
            ApiError::invalid_argument(&format!(
                "Review duration must be less than {} minutes",
                MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
            )),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_summary_empty() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            summary: Some("".to_string()),
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(
                "Proposal review cannot be published due to invalid field: Summary cannot be empty",
            ),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_summary_too_long() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            summary: Some("a".repeat(MAX_PROPOSAL_REVIEW_SUMMARY_CHARS + 1)),
            ..fixtures::proposal_review_draft()
        };
        let error_message = format!(
            "Summary must be less than {} characters",
            MAX_PROPOSAL_REVIEW_SUMMARY_CHARS
        );

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(&format!(
                "Proposal review cannot be published due to invalid field: {}",
                error_message
            )),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_duration_zero() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            review_duration_mins: Some(0),
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(
                "Proposal review cannot be published due to invalid field: Review duration cannot be 0",
            ),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_duration_too_long() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            review_duration_mins: Some(MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS + 1),
            ..fixtures::proposal_review_draft()
        };
        let error_message = format!(
            "Review duration must be less than {} minutes",
            MAX_PROPOSAL_REVIEW_REVIEW_DURATION_MINS
        );

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(&format!(
                "Proposal review cannot be published due to invalid field: {}",
                error_message
            )),
        )
    }

    #[rstest]
    async fn create_proposal_review_image() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (
            id,
            original_proposal_review,
            image_id,
            image,
            request,
            updated_proposal_review,
            expected_response,
        ) = proposal_review_create_image();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock
            .expect_update_proposal_review()
            .once()
            .with(eq(id), eq(updated_proposal_review.clone()))
            .return_const(Ok(()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let mut image_repository_mock = MockImageRepository::new();
        image_repository_mock
            .expect_create_image()
            .once()
            .with(eq(image.clone()))
            .return_const(Ok(image_id));
        let mut certification_repository_mock = MockCertificationRepository::new();
        certification_repository_mock
            .expect_certify_http_response()
            .with(
                eq(image.path(&image_id)),
                eq(create_image_http_response(&image)),
            )
            .once()
            .return_const(());

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review_image(calling_principal, request)
            .await
            .unwrap();

        assert_eq!(result, expected_response);
    }

    #[rstest]
    async fn create_proposal_review_image_already_exists() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, image_id, _, request, _, _) =
            proposal_review_create_image();

        let proposal_review_with_image = ProposalReview {
            images_ids: vec![image_id],
            ..original_proposal_review
        };

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(proposal_review_with_image.proposal_id), eq(user_id))
            .return_const(Some((id, proposal_review_with_image.clone())));
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(proposal_review_with_image.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let mut image_repository_mock = MockImageRepository::new();
        image_repository_mock.expect_create_image().never();
        let mut certification_repository_mock = MockCertificationRepository::new();
        certification_repository_mock
            .expect_certify_http_response()
            .never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .create_proposal_review_image(calling_principal, request.clone())
            .await
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::conflict(&format!(
                "Proposal review for proposal with Id {} already has an image",
                request.proposal_id
            )),
        );
    }

    #[rstest]
    async fn delete_proposal_review_image() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, updated_proposal_review) =
            proposal_review_update_image_delete();

        let image_to_delete = Image {
            sub_path: Some(PathBuf::from_str(PROPOSAL_REVIEW_IMAGES_SUB_PATH).unwrap()),
            ..fixtures::image_without_subpath()
        };
        let image_id_to_delete = original_proposal_review
            .images_ids
            .first()
            .unwrap()
            .to_owned();

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock
            .expect_update_proposal_review()
            .once()
            .with(eq(id), eq(updated_proposal_review.clone()))
            .return_const(Ok(()));
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let mut image_repository_mock = MockImageRepository::new();
        image_repository_mock
            .expect_delete_image()
            .once()
            .with(eq(image_id_to_delete))
            .return_const(Ok(image_to_delete.clone()));
        let mut certification_repository_mock = MockCertificationRepository::new();
        certification_repository_mock
            .expect_remove_http_response_certificate()
            .with(
                eq(image_to_delete.path(&image_id_to_delete)),
                eq(create_image_http_response(&image_to_delete)),
            )
            .once()
            .return_const(());

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        service
            .delete_proposal_review_image(calling_principal, request)
            .unwrap();
    }

    #[rstest]
    async fn delete_proposal_review_image_not_found() {
        let calling_principal = fixtures::principal();
        let user_id = fixtures::uuid_a();
        let (id, original_proposal_review, request, _) = proposal_review_update_image_delete();

        let original_proposal_review = ProposalReview {
            images_ids: vec![],
            ..original_proposal_review
        };

        let mut u_repository_mock = MockUserProfileRepository::new();
        u_repository_mock
            .expect_get_user_id_by_principal()
            .once()
            .with(eq(calling_principal))
            .return_const(Some(user_id));
        let mut pr_repository_mock = MockProposalReviewRepository::new();
        pr_repository_mock
            .expect_get_proposal_review_by_proposal_id_and_user_id()
            .once()
            .with(eq(original_proposal_review.proposal_id), eq(user_id))
            .return_const(Some((id, original_proposal_review.clone())));
        pr_repository_mock.expect_update_proposal_review().never();
        let mut p_repository_mock = MockProposalRepository::new();
        p_repository_mock
            .expect_get_proposal_by_id()
            .once()
            .with(eq(original_proposal_review.proposal_id))
            .return_const(Some(fixtures::nns_replica_version_management_proposal(
                None, None,
            )));
        let prc_repository_mock = MockProposalReviewCommitRepository::new();
        let mut image_repository_mock = MockImageRepository::new();
        image_repository_mock.expect_delete_image().never();
        let mut certification_repository_mock = MockCertificationRepository::new();
        certification_repository_mock
            .expect_remove_http_response_certificate()
            .never();

        let service = ProposalReviewServiceImpl::new(
            pr_repository_mock,
            u_repository_mock,
            p_repository_mock,
            prc_repository_mock,
            image_repository_mock,
            certification_repository_mock,
        );

        let result = service
            .delete_proposal_review_image(calling_principal, request.clone())
            .unwrap_err();

        assert_eq!(
            result,
            ApiError::not_found(&format!(
                "Image with path {} not found in proposal review for proposal with Id {}",
                request.image_path, request.proposal_id
            )),
        );
    }

    #[fixture]
    fn proposal_review_create_image() -> (
        ProposalReviewId,
        ProposalReview,
        ImageId,
        Image,
        CreateProposalReviewImageRequest,
        ProposalReview,
        CreateProposalReviewImageResponse,
    ) {
        let proposal_review_id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let original_proposal_review = ProposalReview {
            user_id,
            images_ids: vec![],
            ..fixtures::proposal_review_draft()
        };
        let image = Image {
            created_at: DateTime::new(date_time).unwrap(),
            sub_path: Some(PathBuf::from_str(PROPOSAL_REVIEW_IMAGES_SUB_PATH).unwrap()),
            user_id,
            ..fixtures::image_without_subpath()
        };
        let image_id = fixtures::uuid_b();

        (
            proposal_review_id,
            original_proposal_review.clone(),
            image_id,
            image.clone(),
            CreateProposalReviewImageRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                content_type: image.content_type.clone(),
                content_bytes: image.content_bytes.clone(),
            },
            ProposalReview {
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                images_ids: vec![image_id],
                ..original_proposal_review
            },
            CreateProposalReviewImageResponse {
                path: image.path(&image_id),
            },
        )
    }

    #[fixture]
    fn proposal_review_update_image_existing() -> (
        ProposalReviewId,
        ProposalReview,
        ImageId,
        Image,
        CreateProposalReviewImageRequest,
        ProposalReview,
        CreateProposalReviewImageResponse,
    ) {
        let proposal_review_id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let user_id = fixtures::uuid_a();
        let original_proposal_review = ProposalReview {
            user_id,
            images_ids: vec![fixtures::uuid_b()],
            ..fixtures::proposal_review_draft()
        };
        let image = Image {
            created_at: DateTime::new(date_time).unwrap(),
            sub_path: Some(PathBuf::from_str(PROPOSAL_REVIEW_IMAGES_SUB_PATH).unwrap()),
            user_id,
            ..fixtures::image_without_subpath()
        };
        let image_id = fixtures::uuid_b();

        (
            proposal_review_id,
            original_proposal_review.clone(),
            image_id,
            image.clone(),
            CreateProposalReviewImageRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                content_type: image.content_type.clone(),
                content_bytes: image.content_bytes.clone(),
            },
            ProposalReview {
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                images_ids: vec![image_id],
                ..original_proposal_review
            },
            CreateProposalReviewImageResponse {
                path: image.path(&image_id),
            },
        )
    }

    #[fixture]
    fn proposal_review_update_image_delete() -> (
        ProposalReviewId,
        ProposalReview,
        DeleteProposalReviewImageRequest,
        ProposalReview,
    ) {
        let proposal_review_id = fixtures::proposal_review_id();
        let date_time = get_date_time().unwrap();
        let image_id = fixtures::uuid_b();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            images_ids: vec![image_id],
            ..fixtures::proposal_review_draft()
        };

        (
            proposal_review_id,
            original_proposal_review.clone(),
            DeleteProposalReviewImageRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                image_path: format!(
                    "{IMAGES_BASE_PATH}{PROPOSAL_REVIEW_IMAGES_SUB_PATH}/{}",
                    image_id.to_string()
                ),
            },
            ProposalReview {
                last_updated_at: Some(DateTime::new(date_time).unwrap()),
                images_ids: vec![],
                ..original_proposal_review
            },
        )
    }
    #[fixture]
    fn proposal_review_update_publish_no_summary() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            summary: None,
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(
                "Proposal review cannot be published due to invalid field: Summary cannot be empty",
            ),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_no_duration() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            review_duration_mins: None,
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(
                "Proposal review cannot be published due to invalid field: Review duration cannot be empty",
            ),
        )
    }

    #[fixture]
    fn proposal_review_update_publish_no_build_reproduced() -> (
        ProposalReviewId,
        ProposalReview,
        UpdateProposalReviewRequest,
        ApiError,
    ) {
        let id = fixtures::proposal_review_id();
        let original_proposal_review = ProposalReview {
            user_id: fixtures::uuid_a(),
            build_reproduced: None,
            ..fixtures::proposal_review_draft()
        };

        (
            id,
            original_proposal_review.clone(),
            UpdateProposalReviewRequest {
                proposal_id: original_proposal_review.proposal_id.to_string(),
                status: Some(backend_api::ProposalReviewStatus::Published),
                summary: None,
                review_duration_mins: None,
                build_reproduced: None,
                vote: None,
            },
            ApiError::conflict(
                "Proposal review cannot be published due to invalid field: Build reproduced cannot be empty",
            ),
        )
    }
}
