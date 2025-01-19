#!/bin/bash

IC_ARG=""
if [[ " $@ " =~ " --ic " ]]; then
  IC_ARG="--ic"
fi

echo "IC_ARGS: $IC_ARG"

# Regularly check if new topics need to be added to the `exclude_topic` list
# https://github.com/dfinity/ic/blob/master/rs/nns/governance/src/gen/ic_nns_governance.pb.v1.rs
dfx canister call $IC_ARG \
  --candid ./scripts/canisters/governance.did \
  rrkah-fqaaa-aaaaa-aaaaq-cai \
  list_proposals \
  '(
    record {
      include_reward_status = vec {};
      limit = 20;
      exclude_topic = vec { 0; 1; 2; 3; 4; 5; 6; 7; 8; 9; 10; 12; 14; 15; 16; 17; 18 };
      include_status = vec { 1; };
    }
  )'
