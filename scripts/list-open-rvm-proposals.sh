dfx canister call \
  --candid ./scripts/canisters/governance.did \
  rrkah-fqaaa-aaaaa-aaaaq-cai \
  list_proposals \
  '(
    record {
      include_reward_status = vec {};
      limit = 20;
      exclude_topic = vec { 0; 1; 2; 3; 4; 5; 6; 7; 8; 9; 10; 11; 12; 14; 15 };
      include_status = vec { 1; };
    }
  )'
