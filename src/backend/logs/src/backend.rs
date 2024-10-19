// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
use candid::{self, CandidType, Deserialize, Principal};
use ic_cdk::api::call::CallResult as Result;

#[derive(CandidType, Deserialize)]
pub enum SocialLinkPlatform {
  #[serde(rename="x")]
  X,
  #[serde(rename="taggr")]
  Taggr,
  #[serde(rename="dfinityforum")]
  Dfinityforum,
  #[serde(rename="website")]
  Website,
  #[serde(rename="discord")]
  Discord,
  #[serde(rename="dscvr")]
  Dscvr,
  #[serde(rename="github")]
  Github,
  #[serde(rename="openchat")]
  Openchat,
}
#[derive(CandidType, Deserialize)]
pub struct SocialLink { pub username: String, pub platform: SocialLinkPlatform }
#[derive(CandidType, Deserialize)]
pub enum UserConfig {
  #[serde(rename="admin")]
  Admin{ bio: String },
  #[serde(rename="anonymous")]
  Anonymous,
  #[serde(rename="reviewer")]
  Reviewer{
    bio: String,
    wallet_address: String,
    social_links: Vec<SocialLink>,
    neuron_id: u64,
  },
}
#[derive(CandidType, Deserialize)]
pub struct Err { pub code: u16, pub message: String }
#[derive(CandidType, Deserialize)]
pub enum CreateMyUserProfileResponse {
  #[serde(rename="ok")]
  Ok{ id: String, username: String, config: UserConfig },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct CreateProposalReviewRequest {
  pub review_duration_mins: Option<u16>,
  pub summary: Option<String>,
  pub proposal_id: String,
  pub build_reproduced: Option<bool>,
}
#[derive(CandidType, Deserialize)]
pub enum ProposalReviewStatus {
  #[serde(rename="published")]
  Published,
  #[serde(rename="draft")]
  Draft,
}
#[derive(CandidType, Deserialize)]
pub enum ReviewCommitState {
  #[serde(rename="not_reviewed")]
  NotReviewed,
  #[serde(rename="reviewed")]
  Reviewed{
    highlights: Vec<String>,
    comment: Option<String>,
    matches_description: Option<bool>,
  },
}
#[derive(CandidType, Deserialize)]
pub struct ProposalReviewCommit {
  pub proposal_review_id: String,
  pub created_at: String,
  pub user_id: String,
  pub state: ReviewCommitState,
  pub last_updated_at: Option<String>,
  pub commit_sha: String,
}
#[derive(CandidType, Deserialize)]
pub struct ProposalReviewCommitWithId {
  pub id: String,
  pub proposal_review_commit: ProposalReviewCommit,
}
#[derive(CandidType, Deserialize)]
pub struct ProposalReview {
  pub status: ProposalReviewStatus,
  pub proposal_review_commits: Vec<ProposalReviewCommitWithId>,
  pub created_at: String,
  pub user_id: String,
  pub review_duration_mins: Option<u16>,
  pub summary: Option<String>,
  pub images_paths: Vec<String>,
  pub last_updated_at: Option<String>,
  pub proposal_id: String,
  pub build_reproduced: Option<bool>,
}
#[derive(CandidType, Deserialize)]
pub struct ProposalReviewWithId {
  pub id: String,
  pub proposal_review: ProposalReview,
}
#[derive(CandidType, Deserialize)]
pub enum CreateProposalReviewResponse {
  #[serde(rename="ok")]
  Ok(ProposalReviewWithId),
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct CreateProposalReviewCommitRequest {
  pub proposal_review_id: String,
  pub state: ReviewCommitState,
  pub commit_sha: String,
}
#[derive(CandidType, Deserialize)]
pub enum CreateProposalReviewCommitResponse {
  #[serde(rename="ok")]
  Ok(ProposalReviewCommitWithId),
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct CreateProposalReviewImageRequest {
  pub content_type: String,
  pub content_bytes: serde_bytes::ByteBuf,
  pub proposal_id: String,
}
#[derive(CandidType, Deserialize)]
pub enum CreateProposalReviewImageResponse {
  #[serde(rename="ok")]
  Ok{ path: String },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct DeleteProposalReviewCommitRequest { pub id: String }
#[derive(CandidType, Deserialize)]
pub enum DeleteProposalReviewCommitResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct DeleteProposalReviewImageRequest {
  pub image_path: String,
  pub proposal_id: String,
}
#[derive(CandidType, Deserialize)]
pub enum DeleteProposalReviewImageResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct GetMyProposalReviewRequest { pub proposal_id: String }
#[derive(CandidType, Deserialize)]
pub enum GetMyProposalReviewResponse {
  #[serde(rename="ok")]
  Ok(ProposalReviewWithId),
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum GetMyUserProfileResponse {
  #[serde(rename="ok")]
  Ok{ id: String, username: String, config: UserConfig },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum HistoryAction {
  #[serde(rename="restore")]
  Restore,
  #[serde(rename="delete")]
  Delete,
  #[serde(rename="create")]
  Create,
  #[serde(rename="update")]
  Update,
}
#[derive(CandidType, Deserialize)]
pub struct UserProfileHistoryEntry {
  pub username: String,
  pub config: UserConfig,
}
#[derive(CandidType, Deserialize)]
pub struct GetMyUserProfileHistoryResponseOkHistoryItem {
  pub action: HistoryAction,
  pub data: UserProfileHistoryEntry,
  pub date_time: String,
  pub user: Principal,
}
#[derive(CandidType, Deserialize)]
pub enum GetMyUserProfileHistoryResponse {
  #[serde(rename="ok")]
  Ok{ history: Vec<GetMyUserProfileHistoryResponseOkHistoryItem> },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct GetProposalReviewRequest { pub proposal_review_id: String }
#[derive(CandidType, Deserialize)]
pub enum GetProposalReviewResponse {
  #[serde(rename="ok")]
  Ok(ProposalReviewWithId),
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct HeaderField (pub String,pub String,);
#[derive(CandidType, Deserialize)]
pub struct HttpRequest {
  pub url: String,
  pub method: String,
  pub body: serde_bytes::ByteBuf,
  pub headers: Vec<HeaderField>,
  pub certificate_version: Option<u16>,
}
#[derive(CandidType, Deserialize)]
pub struct HttpResponse {
  pub body: serde_bytes::ByteBuf,
  pub headers: Vec<HeaderField>,
  pub status_code: u16,
}
#[derive(CandidType, Deserialize)]
pub enum LogLevel {
  #[serde(rename="info")]
  Info,
  #[serde(rename="warn")]
  Warn,
  #[serde(rename="error")]
  Error,
}
#[derive(CandidType, Deserialize)]
pub struct LogsFilterRequest {
  pub context_contains_any: Option<Vec<String>>,
  pub level: Option<LogLevel>,
  pub message_contains_any: Option<Vec<String>>,
  pub after_timestamp_ms: Option<u64>,
  pub before_timestamp_ms: Option<u64>,
}
#[derive(CandidType, Deserialize)]
pub struct LogEntry {
  pub context: Option<String>,
  pub date_time: String,
  pub level: LogLevel,
  pub message: String,
}
#[derive(CandidType, Deserialize)]
pub enum ListLogsResponse {
  #[serde(rename="ok")]
  Ok{ logs: Vec<LogEntry> },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct ListProposalReviewsRequest {
  pub user_id: Option<String>,
  pub proposal_id: Option<String>,
}
#[derive(CandidType, Deserialize)]
pub enum ListProposalReviewsResponse {
  #[serde(rename="ok")]
  Ok{ proposal_reviews: Vec<ProposalReviewWithId> },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum ReviewPeriodStateKey {
  #[serde(rename="in_progress")]
  InProgress,
  #[serde(rename="completed")]
  Completed,
}
#[derive(CandidType, Deserialize)]
pub struct ListProposalsRequest { pub state: Option<ReviewPeriodStateKey> }
#[derive(CandidType, Deserialize)]
pub enum ReviewPeriodState {
  #[serde(rename="in_progress")]
  InProgress,
  #[serde(rename="completed")]
  Completed{ completed_at: String },
}
#[derive(CandidType, Deserialize)]
pub struct NeuronId { pub id: u64 }
#[derive(CandidType, Deserialize)]
pub struct GovernanceError { pub error_message: String, pub error_type: i32 }
#[derive(CandidType, Deserialize)]
pub struct Ballot { pub vote: i32, pub voting_power: u64 }
#[derive(CandidType, Deserialize)]
pub struct CanisterStatusResultV2 {
  pub status: Option<i32>,
  pub freezing_threshold: Option<u64>,
  pub controllers: Vec<Principal>,
  pub memory_size: Option<u64>,
  pub cycles: Option<u64>,
  pub idle_cycles_burned_per_day: Option<u64>,
  pub module_hash: serde_bytes::ByteBuf,
}
#[derive(CandidType, Deserialize)]
pub struct CanisterSummary {
  pub status: Option<CanisterStatusResultV2>,
  pub canister_id: Option<Principal>,
}
#[derive(CandidType, Deserialize)]
pub struct SwapBackgroundInformation {
  pub ledger_index_canister_summary: Option<CanisterSummary>,
  pub fallback_controller_principal_ids: Vec<Principal>,
  pub ledger_archive_canister_summaries: Vec<CanisterSummary>,
  pub ledger_canister_summary: Option<CanisterSummary>,
  pub swap_canister_summary: Option<CanisterSummary>,
  pub governance_canister_summary: Option<CanisterSummary>,
  pub root_canister_summary: Option<CanisterSummary>,
  pub dapp_canister_summaries: Vec<CanisterSummary>,
}
#[derive(CandidType, Deserialize)]
pub struct DerivedProposalInformation {
  pub swap_background_information: Option<SwapBackgroundInformation>,
}
#[derive(CandidType, Deserialize)]
pub struct Tally {
  pub no: u64,
  pub yes: u64,
  pub total: u64,
  pub timestamp_seconds: u64,
}
#[derive(CandidType, Deserialize)]
pub struct KnownNeuronData { pub name: String, pub description: Option<String> }
#[derive(CandidType, Deserialize)]
pub struct KnownNeuron {
  pub id: Option<NeuronId>,
  pub known_neuron_data: Option<KnownNeuronData>,
}
#[derive(CandidType, Deserialize)]
pub struct Spawn {
  pub percentage_to_spawn: Option<u32>,
  pub new_controller: Option<Principal>,
  pub nonce: Option<u64>,
}
#[derive(CandidType, Deserialize)]
pub struct Split { pub amount_e8s: u64 }
#[derive(CandidType, Deserialize)]
pub struct Follow { pub topic: i32, pub followees: Vec<NeuronId> }
#[derive(CandidType, Deserialize)]
pub struct ClaimOrRefreshNeuronFromAccount {
  pub controller: Option<Principal>,
  pub memo: u64,
}
#[derive(CandidType, Deserialize)]
pub enum By {
  NeuronIdOrSubaccount{},
  MemoAndController(ClaimOrRefreshNeuronFromAccount),
  Memo(u64),
}
#[derive(CandidType, Deserialize)]
pub struct ClaimOrRefresh { pub by: Option<By> }
#[derive(CandidType, Deserialize)]
pub struct RemoveHotKey { pub hot_key_to_remove: Option<Principal> }
#[derive(CandidType, Deserialize)]
pub struct AddHotKey { pub new_hot_key: Option<Principal> }
#[derive(CandidType, Deserialize)]
pub struct ChangeAutoStakeMaturity {
  pub requested_setting_for_auto_stake_maturity: bool,
}
#[derive(CandidType, Deserialize)]
pub struct IncreaseDissolveDelay { pub additional_dissolve_delay_seconds: u32 }
#[derive(CandidType, Deserialize)]
pub struct SetDissolveTimestamp { pub dissolve_timestamp_seconds: u64 }
#[derive(CandidType, Deserialize)]
pub enum Operation {
  RemoveHotKey(RemoveHotKey),
  AddHotKey(AddHotKey),
  ChangeAutoStakeMaturity(ChangeAutoStakeMaturity),
  StopDissolving{},
  StartDissolving{},
  IncreaseDissolveDelay(IncreaseDissolveDelay),
  JoinCommunityFund{},
  LeaveCommunityFund{},
  SetDissolveTimestamp(SetDissolveTimestamp),
}
#[derive(CandidType, Deserialize)]
pub struct Configure { pub operation: Option<Operation> }
#[derive(CandidType, Deserialize)]
pub struct RegisterVote { pub vote: i32, pub proposal: Option<NeuronId> }
#[derive(CandidType, Deserialize)]
pub struct Merge { pub source_neuron_id: Option<NeuronId> }
#[derive(CandidType, Deserialize)]
pub struct DisburseToNeuron {
  pub dissolve_delay_seconds: u64,
  pub kyc_verified: bool,
  pub amount_e8s: u64,
  pub new_controller: Option<Principal>,
  pub nonce: u64,
}
#[derive(CandidType, Deserialize)]
pub struct StakeMaturity { pub percentage_to_stake: Option<u32> }
#[derive(CandidType, Deserialize)]
pub struct MergeMaturity { pub percentage_to_merge: u32 }
#[derive(CandidType, Deserialize)]
pub struct AccountIdentifier { pub hash: serde_bytes::ByteBuf }
#[derive(CandidType, Deserialize)]
pub struct Amount { pub e8s: u64 }
#[derive(CandidType, Deserialize)]
pub struct Disburse {
  pub to_account: Option<AccountIdentifier>,
  pub amount: Option<Amount>,
}
#[derive(CandidType, Deserialize)]
pub enum Command {
  Spawn(Spawn),
  Split(Split),
  Follow(Follow),
  ClaimOrRefresh(ClaimOrRefresh),
  Configure(Configure),
  RegisterVote(RegisterVote),
  Merge(Merge),
  DisburseToNeuron(DisburseToNeuron),
  MakeProposal(Box<Proposal>),
  StakeMaturity(StakeMaturity),
  MergeMaturity(MergeMaturity),
  Disburse(Disburse),
}
#[derive(CandidType, Deserialize)]
pub enum NeuronIdOrSubaccount {
  Subaccount(serde_bytes::ByteBuf),
  NeuronId(NeuronId),
}
#[derive(CandidType, Deserialize)]
pub struct ManageNeuron {
  pub id: Option<NeuronId>,
  pub command: Option<Command>,
  pub neuron_id_or_subaccount: Option<NeuronIdOrSubaccount>,
}
#[derive(CandidType, Deserialize)]
pub struct Percentage { pub basis_points: Option<u64> }
#[derive(CandidType, Deserialize)]
pub struct Duration { pub seconds: Option<u64> }
#[derive(CandidType, Deserialize)]
pub struct Tokens { pub e8s: Option<u64> }
#[derive(CandidType, Deserialize)]
pub struct VotingRewardParameters {
  pub reward_rate_transition_duration: Option<Duration>,
  pub initial_reward_rate: Option<Percentage>,
  pub final_reward_rate: Option<Percentage>,
}
#[derive(CandidType, Deserialize)]
pub struct GovernanceParameters {
  pub neuron_maximum_dissolve_delay_bonus: Option<Percentage>,
  pub neuron_maximum_age_for_age_bonus: Option<Duration>,
  pub neuron_maximum_dissolve_delay: Option<Duration>,
  pub neuron_minimum_dissolve_delay_to_vote: Option<Duration>,
  pub neuron_maximum_age_bonus: Option<Percentage>,
  pub neuron_minimum_stake: Option<Tokens>,
  pub proposal_wait_for_quiet_deadline_increase: Option<Duration>,
  pub proposal_initial_voting_period: Option<Duration>,
  pub proposal_rejection_fee: Option<Tokens>,
  pub voting_reward_parameters: Option<VotingRewardParameters>,
}
#[derive(CandidType, Deserialize)]
pub struct Image { pub base64_encoding: Option<String> }
#[derive(CandidType, Deserialize)]
pub struct LedgerParameters {
  pub transaction_fee: Option<Tokens>,
  pub token_symbol: Option<String>,
  pub token_logo: Option<Image>,
  pub token_name: Option<String>,
}
#[derive(CandidType, Deserialize)]
pub struct Canister { pub id: Option<Principal> }
#[derive(CandidType, Deserialize)]
pub struct NeuronBasketConstructionParameters {
  pub dissolve_delay_interval: Option<Duration>,
  pub count: Option<u64>,
}
#[derive(CandidType, Deserialize)]
pub struct GlobalTimeOfDay { pub seconds_after_utc_midnight: Option<u64> }
#[derive(CandidType, Deserialize)]
pub struct Countries { pub iso_codes: Vec<String> }
#[derive(CandidType, Deserialize)]
pub struct SwapParameters {
  pub minimum_participants: Option<u64>,
  pub neurons_fund_participation: Option<bool>,
  pub duration: Option<Duration>,
  pub neuron_basket_construction_parameters: Option<
    NeuronBasketConstructionParameters
  >,
  pub confirmation_text: Option<String>,
  pub maximum_participant_icp: Option<Tokens>,
  pub minimum_icp: Option<Tokens>,
  pub minimum_direct_participation_icp: Option<Tokens>,
  pub minimum_participant_icp: Option<Tokens>,
  pub start_time: Option<GlobalTimeOfDay>,
  pub maximum_direct_participation_icp: Option<Tokens>,
  pub maximum_icp: Option<Tokens>,
  pub neurons_fund_investment_icp: Option<Tokens>,
  pub restricted_countries: Option<Countries>,
}
#[derive(CandidType, Deserialize)]
pub struct SwapDistribution { pub total: Option<Tokens> }
#[derive(CandidType, Deserialize)]
pub struct NeuronDistribution {
  pub controller: Option<Principal>,
  pub dissolve_delay: Option<Duration>,
  pub memo: Option<u64>,
  pub vesting_period: Option<Duration>,
  pub stake: Option<Tokens>,
}
#[derive(CandidType, Deserialize)]
pub struct DeveloperDistribution {
  pub developer_neurons: Vec<NeuronDistribution>,
}
#[derive(CandidType, Deserialize)]
pub struct InitialTokenDistribution {
  pub treasury_distribution: Option<SwapDistribution>,
  pub developer_distribution: Option<DeveloperDistribution>,
  pub swap_distribution: Option<SwapDistribution>,
}
#[derive(CandidType, Deserialize)]
pub struct CreateServiceNervousSystem {
  pub url: Option<String>,
  pub governance_parameters: Option<GovernanceParameters>,
  pub fallback_controller_principal_ids: Vec<Principal>,
  pub logo: Option<Image>,
  pub name: Option<String>,
  pub ledger_parameters: Option<LedgerParameters>,
  pub description: Option<String>,
  pub dapp_canisters: Vec<Canister>,
  pub swap_parameters: Option<SwapParameters>,
  pub initial_token_distribution: Option<InitialTokenDistribution>,
}
#[derive(CandidType, Deserialize)]
pub struct ExecuteNnsFunction {
  pub nns_function: i32,
  pub payload: serde_bytes::ByteBuf,
}
#[derive(CandidType, Deserialize)]
pub struct NodeProvider {
  pub id: Option<Principal>,
  pub reward_account: Option<AccountIdentifier>,
}
#[derive(CandidType, Deserialize)]
pub struct RewardToNeuron { pub dissolve_delay_seconds: u64 }
#[derive(CandidType, Deserialize)]
pub struct RewardToAccount { pub to_account: Option<AccountIdentifier> }
#[derive(CandidType, Deserialize)]
pub enum RewardMode {
  RewardToNeuron(RewardToNeuron),
  RewardToAccount(RewardToAccount),
}
#[derive(CandidType, Deserialize)]
pub struct RewardNodeProvider {
  pub node_provider: Option<NodeProvider>,
  pub reward_mode: Option<RewardMode>,
  pub amount_e8s: u64,
}
#[derive(CandidType, Deserialize)]
pub struct NeuronBasketConstructionParameters1 {
  pub dissolve_delay_interval_seconds: u64,
  pub count: u64,
}
#[derive(CandidType, Deserialize)]
pub struct Params {
  pub min_participant_icp_e8s: u64,
  pub neuron_basket_construction_parameters: Option<
    NeuronBasketConstructionParameters1
  >,
  pub max_icp_e8s: u64,
  pub swap_due_timestamp_seconds: u64,
  pub min_participants: u32,
  pub sns_token_e8s: u64,
  pub sale_delay_seconds: Option<u64>,
  pub max_participant_icp_e8s: u64,
  pub min_direct_participation_icp_e8s: Option<u64>,
  pub min_icp_e8s: u64,
  pub max_direct_participation_icp_e8s: Option<u64>,
}
#[derive(CandidType, Deserialize)]
pub struct OpenSnsTokenSwap {
  pub community_fund_investment_e8s: Option<u64>,
  pub target_swap_canister_id: Option<Principal>,
  pub params: Option<Params>,
}
#[derive(CandidType, Deserialize)]
pub struct TimeWindow {
  pub start_timestamp_seconds: u64,
  pub end_timestamp_seconds: u64,
}
#[derive(CandidType, Deserialize)]
pub struct SetOpenTimeWindowRequest { pub open_time_window: Option<TimeWindow> }
#[derive(CandidType, Deserialize)]
pub struct SetSnsTokenSwapOpenTimeWindow {
  pub request: Option<SetOpenTimeWindowRequest>,
  pub swap_canister_id: Option<Principal>,
}
#[derive(CandidType, Deserialize)]
pub struct Followees { pub followees: Vec<NeuronId> }
#[derive(CandidType, Deserialize)]
pub struct SetDefaultFollowees { pub default_followees: Vec<(i32,Followees,)> }
#[derive(CandidType, Deserialize)]
pub struct RewardNodeProviders {
  pub use_registry_derived_rewards: Option<bool>,
  pub rewards: Vec<RewardNodeProvider>,
}
#[derive(CandidType, Deserialize)]
pub struct NetworkEconomics {
  pub neuron_minimum_stake_e8s: u64,
  pub max_proposals_to_keep_per_topic: u32,
  pub neuron_management_fee_per_proposal_e8s: u64,
  pub reject_cost_e8s: u64,
  pub transaction_fee_e8s: u64,
  pub neuron_spawn_dissolve_delay_seconds: u64,
  pub minimum_icp_xdr_rate: u64,
  pub maximum_node_provider_rewards_e8s: u64,
}
#[derive(CandidType, Deserialize)]
pub struct ApproveGenesisKyc { pub principals: Vec<Principal> }
#[derive(CandidType, Deserialize)]
pub enum Change { ToRemove(NodeProvider), ToAdd(NodeProvider) }
#[derive(CandidType, Deserialize)]
pub struct AddOrRemoveNodeProvider { pub change: Option<Change> }
#[derive(CandidType, Deserialize)]
pub struct Motion { pub motion_text: String }
#[derive(CandidType, Deserialize)]
pub enum Action {
  RegisterKnownNeuron(KnownNeuron),
  ManageNeuron(ManageNeuron),
  CreateServiceNervousSystem(CreateServiceNervousSystem),
  ExecuteNnsFunction(ExecuteNnsFunction),
  RewardNodeProvider(RewardNodeProvider),
  OpenSnsTokenSwap(OpenSnsTokenSwap),
  SetSnsTokenSwapOpenTimeWindow(SetSnsTokenSwapOpenTimeWindow),
  SetDefaultFollowees(SetDefaultFollowees),
  RewardNodeProviders(RewardNodeProviders),
  ManageNetworkEconomics(NetworkEconomics),
  ApproveGenesisKyc(ApproveGenesisKyc),
  AddOrRemoveNodeProvider(AddOrRemoveNodeProvider),
  Motion(Motion),
}
#[derive(CandidType, Deserialize)]
pub struct Proposal {
  pub url: String,
  pub title: Option<String>,
  pub action: Option<Action>,
  pub summary: String,
}
#[derive(CandidType, Deserialize)]
pub struct ProposalInfo {
  pub id: Option<NeuronId>,
  pub status: i32,
  pub topic: i32,
  pub failure_reason: Option<GovernanceError>,
  pub ballots: Vec<(u64,Ballot,)>,
  pub proposal_timestamp_seconds: u64,
  pub reward_event_round: u64,
  pub deadline_timestamp_seconds: Option<u64>,
  pub failed_timestamp_seconds: u64,
  pub reject_cost_e8s: u64,
  pub derived_proposal_information: Option<DerivedProposalInformation>,
  pub latest_tally: Option<Tally>,
  pub reward_status: i32,
  pub decided_timestamp_seconds: u64,
  pub proposal: Option<Box<Proposal>>,
  pub proposer: Option<NeuronId>,
  pub executed_timestamp_seconds: u64,
}
#[derive(CandidType, Deserialize)]
pub enum NervousSystem {
  #[serde(rename="network")]
  Network{ id: u64, proposal_info: ProposalInfo },
}
#[derive(CandidType, Deserialize)]
pub struct BackendProposal {
  pub state: ReviewPeriodState,
  pub synced_at: String,
  pub nervous_system: NervousSystem,
  pub proposed_at: String,
}
#[derive(CandidType, Deserialize)]
pub struct ProposalResponse { pub id: String, pub proposal: BackendProposal }
#[derive(CandidType, Deserialize)]
pub enum ListProposalsResponse {
  #[serde(rename="ok")]
  Ok{ proposals: Vec<ProposalResponse> },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum SyncProposalsResponse {
  #[serde(rename="ok")]
  Ok{ synced_proposals_count: u64, completed_proposals_count: u64 },
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum MyUserConfigUpdate {
  #[serde(rename="admin")]
  Admin{ bio: Option<String> },
  #[serde(rename="anonymous")]
  Anonymous,
  #[serde(rename="reviewer")]
  Reviewer{
    bio: Option<String>,
    wallet_address: Option<String>,
    social_links: Option<Vec<SocialLink>>,
  },
}
#[derive(CandidType, Deserialize)]
pub struct UpdateMyUserProfileRequest {
  pub username: Option<String>,
  pub config: Option<MyUserConfigUpdate>,
}
#[derive(CandidType, Deserialize)]
pub enum UpdateMyUserProfileResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct UpdateProposalReviewRequest {
  pub status: Option<ProposalReviewStatus>,
  pub review_duration_mins: Option<u16>,
  pub summary: Option<String>,
  pub proposal_id: String,
  pub build_reproduced: Option<bool>,
}
#[derive(CandidType, Deserialize)]
pub enum UpdateProposalReviewResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub struct UpdateProposalReviewCommitRequest {
  pub id: String,
  pub state: ReviewCommitState,
}
#[derive(CandidType, Deserialize)]
pub enum UpdateProposalReviewCommitResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}
#[derive(CandidType, Deserialize)]
pub enum UserConfigUpdate {
  #[serde(rename="admin")]
  Admin{ bio: Option<String> },
  #[serde(rename="anonymous")]
  Anonymous,
  #[serde(rename="reviewer")]
  Reviewer{
    bio: Option<String>,
    wallet_address: Option<String>,
    social_links: Option<Vec<SocialLink>>,
    neuron_id: Option<u64>,
  },
}
#[derive(CandidType, Deserialize)]
pub struct UpdateUserProfileRequest {
  pub username: Option<String>,
  pub user_id: String,
  pub config: Option<UserConfigUpdate>,
}
#[derive(CandidType, Deserialize)]
pub enum UpdateUserProfileResponse {
  #[serde(rename="ok")]
  Ok,
  #[serde(rename="err")]
  Err(Err),
}

pub struct Service(pub Principal);
impl Service {
  pub async fn create_my_user_profile(&self) -> Result<(CreateMyUserProfileResponse,)> {
    ic_cdk::call(self.0, "create_my_user_profile", ()).await
  }
  pub async fn create_proposal_review(&self, arg0: CreateProposalReviewRequest) -> Result<(CreateProposalReviewResponse,)> {
    ic_cdk::call(self.0, "create_proposal_review", (arg0,)).await
  }
  pub async fn create_proposal_review_commit(&self, arg0: CreateProposalReviewCommitRequest) -> Result<(CreateProposalReviewCommitResponse,)> {
    ic_cdk::call(self.0, "create_proposal_review_commit", (arg0,)).await
  }
  pub async fn create_proposal_review_image(&self, arg0: CreateProposalReviewImageRequest) -> Result<(CreateProposalReviewImageResponse,)> {
    ic_cdk::call(self.0, "create_proposal_review_image", (arg0,)).await
  }
  pub async fn delete_proposal_review_commit(&self, arg0: DeleteProposalReviewCommitRequest) -> Result<(DeleteProposalReviewCommitResponse,)> {
    ic_cdk::call(self.0, "delete_proposal_review_commit", (arg0,)).await
  }
  pub async fn delete_proposal_review_image(&self, arg0: DeleteProposalReviewImageRequest) -> Result<(DeleteProposalReviewImageResponse,)> {
    ic_cdk::call(self.0, "delete_proposal_review_image", (arg0,)).await
  }
  pub async fn get_my_proposal_review(&self, arg0: GetMyProposalReviewRequest) -> Result<(GetMyProposalReviewResponse,)> {
    ic_cdk::call(self.0, "get_my_proposal_review", (arg0,)).await
  }
  pub async fn get_my_user_profile(&self) -> Result<(GetMyUserProfileResponse,)> {
    ic_cdk::call(self.0, "get_my_user_profile", ()).await
  }
  pub async fn get_my_user_profile_history(&self) -> Result<(GetMyUserProfileHistoryResponse,)> {
    ic_cdk::call(self.0, "get_my_user_profile_history", ()).await
  }
  pub async fn get_proposal_review(&self, arg0: GetProposalReviewRequest) -> Result<(GetProposalReviewResponse,)> {
    ic_cdk::call(self.0, "get_proposal_review", (arg0,)).await
  }
  pub async fn http_request(&self, arg0: HttpRequest) -> Result<(HttpResponse,)> {
    ic_cdk::call(self.0, "http_request", (arg0,)).await
  }
  pub async fn list_logs(&self, arg0: LogsFilterRequest) -> Result<(ListLogsResponse,)> {
    ic_cdk::call(self.0, "list_logs", (arg0,)).await
  }
  pub async fn list_proposal_reviews(&self, arg0: ListProposalReviewsRequest) -> Result<(ListProposalReviewsResponse,)> {
    ic_cdk::call(self.0, "list_proposal_reviews", (arg0,)).await
  }
  pub async fn list_proposals(&self, arg0: ListProposalsRequest) -> Result<(ListProposalsResponse,)> {
    ic_cdk::call(self.0, "list_proposals", (arg0,)).await
  }
  pub async fn sync_proposals(&self) -> Result<(SyncProposalsResponse,)> {
    ic_cdk::call(self.0, "sync_proposals", ()).await
  }
  pub async fn update_my_user_profile(&self, arg0: UpdateMyUserProfileRequest) -> Result<(UpdateMyUserProfileResponse,)> {
    ic_cdk::call(self.0, "update_my_user_profile", (arg0,)).await
  }
  pub async fn update_proposal_review(&self, arg0: UpdateProposalReviewRequest) -> Result<(UpdateProposalReviewResponse,)> {
    ic_cdk::call(self.0, "update_proposal_review", (arg0,)).await
  }
  pub async fn update_proposal_review_commit(&self, arg0: UpdateProposalReviewCommitRequest) -> Result<(UpdateProposalReviewCommitResponse,)> {
    ic_cdk::call(self.0, "update_proposal_review_commit", (arg0,)).await
  }
  pub async fn update_user_profile(&self, arg0: UpdateUserProfileRequest) -> Result<(UpdateUserProfileResponse,)> {
    ic_cdk::call(self.0, "update_user_profile", (arg0,)).await
  }
}

