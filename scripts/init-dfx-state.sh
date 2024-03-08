#!/bin/bash

docker build \
  -t cg-init-dfx-state \
  -f scripts/_init-dfx-state/Dockerfile \
  .

docker run --rm cg-init-dfx-state
