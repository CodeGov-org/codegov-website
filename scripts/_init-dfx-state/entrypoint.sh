#!/bin/bash

echo -e "\n\n[Init DFX State]: Initializing DFX state"

# Initial NNS subnet setup
# We do this once with the normal system time so downloaded WASMs are cached to avoid
# issues with SSL certificates when we run it again with a faked time in the past.
echo -e "\n[Init DFX State]: Starting DFX with a clean network"
dfx start --clean --background --artificial-delay 0 -qqqq

echo -e "\n[Init DFX State]: Setting up NNS canisters"
dfx extension run nns install

echo -e "\n[Init DFX State]: Deploying backend canister"
dfx deploy backend

echo -e "\n[Init DFX State]: Stopping DFX"
dfx stop

echo -e "\n[Init DFX State]: Setting container datetime to be 48 hours behind current system datetime"
export FAKETIME="-2d"
echo "[Init DFX State]: Current date: $(date)"

echo -e "\n[Init DFX State]: Starting DFX"
dfx start --clean --background --artificial-delay 0 -qqqq

echo -e "\n[Init DFX State]: Setting up NNS canisters"
dfx extension run nns install

echo -e "\n[Init DFX State]: Deploying backend canister"
dfx deploy backend

echo -e "\n[Init DFX State]: Manually syncing proposals"
dfx canister call backend sync_proposals

echo -e "\n[Init DFX State]: Listing proposals"
dfx canister call backend list_proposals '(opt record {})'

echo -e "\n[Init DFX State]: Listing logs"
dfx canister call backend list_logs '(record {})'

echo -e "\n[Init DFX State]: Stopping DFX"
dfx stop

echo -e "\n[Init DFX State]: Resetting container datetime to current system datetime"
export FAKETIME=""
echo "[Init DFX State]: Current date: $(date)"

echo -e "\n[Init DFX State]: Starting DFX"
dfx start --background --artificial-delay 0 -qqqq

echo -e "\n[Init DFX State]: Manually syncing proposals"
dfx canister call backend sync_proposals

echo -e "\n[Init DFX State]: Listing proposals"
dfx canister call backend list_proposals '(opt record {})'

echo -e "\n[Init DFX State]: Listing logs"
dfx canister call backend list_logs '(record {})'

echo -e "\n[Init DFX State]: Stopping DFX"
dfx stop

