use rstest::*;

use crate::repositories::CommitSha;

#[fixture]
pub fn commit_sha_a() -> CommitSha {
    CommitSha::try_from("28111ed23e35353ce852a0ae939eb2bd131ede49").unwrap()
}

#[fixture]
pub fn commit_sha_b() -> CommitSha {
    CommitSha::try_from("47d98477c6c59e570e2220aab433b0943b326ef8").unwrap()
}

#[fixture]
pub fn commit_sha_c() -> CommitSha {
    CommitSha::try_from("e62e328fa193e73fbb7562458d719f311c25d455").unwrap()
}
