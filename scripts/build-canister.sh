#!/bin/bash

PKG=$1
FEATURES="${FEATURES:-}"

echo "Building $PKG, with features: $FEATURES"

WASM_FILE=./target/wasm32-unknown-unknown/release/$PKG.wasm

cargo build --target wasm32-unknown-unknown --release -p $PKG --locked --features "$FEATURES"
