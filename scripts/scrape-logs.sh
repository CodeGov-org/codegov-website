#!/bin/bash

cargo run \
  --package backend_logs \
  --bin backend_logs \
  -- \
  --identity-pem data/codegov-website-logger-identity.pem \
  --loki-endpoint https://logs-prod-eu-west-0.grafana.net \
  --loki-username 152321 \
  --loki-password $LOKI_PASSWORD \
  --backend-canister-id nijcm-2qaaa-aaaal-qcx2a-cai
