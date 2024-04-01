#!/bin/bash

INTEGRATION_TESTS_STATE_DIR=src/backend/integration/state

# unzip the NNS states for the backend integration tests
tar -xvf $INTEGRATION_TESTS_STATE_DIR/proposal_reviews_nns_state.tar.gz -C $INTEGRATION_TESTS_STATE_DIR
