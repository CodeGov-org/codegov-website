#!/bin/bash

QUILL_VERSION="0.4.3"
DIDC_VERSION="2024-07-29"

# Assumes that ~/bin is already added to PATH
BIN="$HOME/bin"
mkdir -p $BIN

# Install FNM
echo "****** SYSTEM SETUP: Installing FNM ******"
curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell --install-dir ~/.fnm

echo "****** SYSTEM SETUP: FNM version ******"
export PATH="~/.fnm:$PATH"
fnm --version

# Set up NodeJS
echo "****** SYSTEM SETUP: Installing NodeJS ******"
fnm install
fnm use

echo "****** SYSTEM SETUP: NodeJS version ******"
node --version

echo "****** SYSTEM SETUP: NPM version ******"
npm --version

# Set up PNPM
echo "****** SYSTEM SETUP: Installing PNPM ******"
corepack enable

echo "****** SYSTEM SETUP: PNPM version ******"
pnpm --version

# Set up Bun
echo "****** SYSTEM SETUP: Installing Bun ******"
curl -fsSL https://bun.sh/install | bash -s "bun-v1.0.26"

# Set up DFX
echo "****** SYSTEM SETUP: Installing DFXVM ******"
DFX_VERSION=$(jq -r '.dfx' ./dfx.json)
DFXVM_INIT_YES=true DFX_VERSION=$DFX_VERSION sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

if [[ "$OSTYPE" == "darwin"* ]]; then
  source "$HOME/Library/Application Support/org.dfinity.dfx/env"
else
  source "$HOME/.local/share/dfx/env"
fi


echo "****** SYSTEM SETUP: DFX version ******"
dfx --version

# Set up Quill
echo "****** SYSTEM SETUP: Installing Quill ******"
QUILL_BIN="$BIN/quill"

if [[ "$OSTYPE" == "darwin"* ]]; then
  wget https://github.com/dfinity/quill/releases/download/$QUILL_VERSION/quill-macos-x86_64 -O $QUILL_BIN
else
  wget https://github.com/dfinity/quill/releases/download/$QUILL_VERSION/quill-linux-x86_64 -O $QUILL_BIN
fi

chmod +x $QUILL_BIN

echo "****** SYSTEM SETUP: Quill version ******"
quill --version

# Set up DIDC
echo "****** SYSTEM SETUP: Installing DIDC ******"
DIDC_BIN="$BIN/didc"

if [[ "$OSTYPE" == "darwin"* ]]; then
  wget https://github.com/dfinity/candid/releases/download/$DIDC_VERSION/didc-macos -O $DIDC_BIN
else
  wget https://github.com/dfinity/candid/releases/download/$DIDC_VERSION/didc-linux64 -O $DIDC_BIN
fi

chmod +x $DIDC_BIN

echo "****** SYSTEM SETUP: DIDC version ******"
didc --version

# Set up local replica
echo "****** SYSTEM SETUP: Setting up NNS canisters ******"
dfx extension install nns
dfx stop
dfx start --clean --background
dfx extension run nns install
dfx stop
