use crate::{
    repositories::{CertificationRepositoryImpl, ImageRepositoryImpl, UserProfileRepositoryImpl},
    services::{
        HttpService, HttpServiceImpl, ImageService, ImageServiceImpl, InitService, InitServiceImpl,
    },
};
use backend_api::ApiError;
use candid::Principal;
use ic_cdk::*;
use ic_cdk_timers::set_timer;
use std::time::Duration;

#[init]
fn init() {
    let calling_principal = caller();

    set_timer(Duration::from_secs(0), move || {
        init_admin(calling_principal)
    });

    InitController::default().init_http_certification();

    jobs::start_jobs();
}

#[post_upgrade]
fn post_upgrade() {
    let calling_principal = caller();

    set_timer(Duration::from_secs(0), move || {
        init_admin(calling_principal)
    });

    InitController::default().init_http_certification();

    jobs::start_jobs();
}

fn init_admin(calling_principal: Principal) {
    if let Err(err) = InitController::default().init(calling_principal) {
        ic_cdk::trap(&format!("Failed to initialize canister: {:?}", err));
    }
}

struct InitController<T: InitService, I: ImageService, H: HttpService> {
    init_service: T,
    image_service: I,
    http_service: H,
}

impl Default
    for InitController<
        InitServiceImpl<UserProfileRepositoryImpl>,
        ImageServiceImpl<ImageRepositoryImpl, CertificationRepositoryImpl>,
        HttpServiceImpl<CertificationRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            InitServiceImpl::default(),
            ImageServiceImpl::default(),
            HttpServiceImpl::default(),
        )
    }
}

impl<T: InitService, I: ImageService, H: HttpService> InitController<T, I, H> {
    fn new(init_service: T, image_service: I, http_service: H) -> Self {
        Self {
            init_service,
            image_service,
            http_service,
        }
    }

    fn init(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.init_service.init(calling_principal)
    }

    fn init_http_certification(&self) {
        self.image_service.certify_all_http_responses();
        self.http_service.certify_default_responses();
    }
}

mod jobs {
    use crate::services::{LogService, LogServiceImpl};
    use ic_cdk::spawn;
    use ic_cdk_timers::set_timer_interval;
    use std::time::Duration;

    /// Starts all cron jobs.
    pub fn start_jobs() {
        nns_proposals::start();

        LogServiceImpl::default()
            .log_info("Jobs started.".to_string(), Some("start_jobs".to_string()))
            .unwrap();
    }

    mod nns_proposals {
        use super::*;
        use crate::controllers::proposal_controller::ProposalController;

        // spawn individiual jobs so that if one fails, the others can still run
        pub fn start() {
            set_timer_interval(Duration::from_millis(300_000), || {
                spawn(sync_proposals());
            });

            set_timer_interval(Duration::from_millis(300_000), || {
                spawn(complete_pending_proposals());
            });
        }

        async fn sync_proposals() {
            ProposalController::default().sync_proposals_job().await;
        }

        async fn complete_pending_proposals() {
            ProposalController::default().complete_pending_proposals_job();
        }
    }
}
