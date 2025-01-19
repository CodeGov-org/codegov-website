# make sure this release matches what is used by `ic-nns-governance` and `ic-nns-common` in `Cargo.toml`.
RELEASE=release-2025-01-09_03-19-base

wget https://raw.githubusercontent.com/dfinity/ic/refs/tags/$RELEASE/rs/nns/governance/canister/governance.did -O ./scripts/canisters/governance.did
wget https://raw.githubusercontent.com/dfinity/ic/refs/tags/$RELEASE/rs/ledger_suite/icp/ledger.did -O ./scripts/canisters/ledger.did

didc bind --target js ./scripts/canisters/governance.did > ./lib/nns-utils/src/canisters/governance.js
didc bind --target ts ./scripts/canisters/governance.did > ./lib/nns-utils/src/canisters/governance.d.ts

didc bind --target js ./scripts/canisters/ledger.did > ./lib/nns-utils/src/canisters/ledger.js
didc bind --target ts ./scripts/canisters/ledger.did > ./lib/nns-utils/src/canisters/ledger.d.ts

pnpm run format
