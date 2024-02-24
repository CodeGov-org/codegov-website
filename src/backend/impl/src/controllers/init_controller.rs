use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{InitService, InitServiceImpl},
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
        spawn(init_admin(calling_principal))
    });

    jobs::start_jobs();
}

#[post_upgrade]
fn post_upgrade() {
    let calling_principal = caller();

    set_timer(Duration::from_secs(0), move || {
        spawn(init_admin(calling_principal))
    });

    jobs::start_jobs();
}

async fn init_admin(calling_principal: Principal) {
    if let Err(err) = InitController::default().init(calling_principal).await {
        ic_cdk::trap(&format!("Failed to initialize canister: {:?}", err));
    }
}

struct InitController<T: InitService> {
    init_service: T,
}

impl Default for InitController<InitServiceImpl<UserProfileRepositoryImpl>> {
    fn default() -> Self {
        Self::new(InitServiceImpl::default())
    }
}

impl<T: InitService> InitController<T> {
    fn new(init_service: T) -> Self {
        Self { init_service }
    }

    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.init_service.init(calling_principal).await
    }
}

mod jobs {
    use ic_cdk::spawn;
    use ic_cdk_timers::set_timer_interval;
    use std::time::Duration;

    use crate::services::{LogService, LogServiceImpl};

    /// Starts all cron jobs.
    pub fn start_jobs() {
        nns_proposals::start();

        LogServiceImpl::default()
            .log_info("Jobs started.".to_string(), Some("start_jobs".to_string()))
            .unwrap();
    }

    mod nns_proposals {
        use crate::controllers::proposal_controller::ProposalController;

        use super::*;

        pub fn start() {
            set_timer_interval(Duration::from_millis(300_000), || {
                spawn(run());
            });
        }

        async fn run() {
            ProposalController::default().sync_proposals_job().await;

            // TODO: close proposals that have passed the review period
        }
    }
}
