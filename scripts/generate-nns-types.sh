#!/bin/bash

echo "Downloading the latest governance.did from the dfinity/ic repo..."
curl -sL https://github.com/dfinity/ic/raw/master/rs/nns/governance/canister/governance.did > candid/nns/governance.did

echo "Generating types..."
didc bind -t rs candid/nns/governance.did > src/backend/generated/src/nns/governance.rs

echo "Done!"
