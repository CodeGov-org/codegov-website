#!/bin/bash

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
curl -fsSL https://bun.sh/install | bash

# Set up DFX
echo "****** SYSTEM SETUP: Installing DFX ******"
$HOME/.cache/dfinity/uninstall.sh
DFX_VERSION=$(jq -r '.dfx' ./dfx.json) sh -ci "$(curl -sSL https://internetcomputer.org/install.sh)"
dfx cache install

echo "****** SYSTEM SETUP: DFX version ******"
dfx --version

# Set up local replica
echo "****** SYSTEM SETUP: Setting up NNS canisters ******"
dfx extension install nns
mkdir -p ~/.config/dfx
cat <<EOF >~/.config/dfx/networks.json
{
  "local": {
    "bind": "127.0.0.1:8080",
    "type": "ephemeral",
    "replica": {
      "subnet_type": "system"
    }
  }
}
EOF

dfx stop
dfx start --clean --background
dfx nns install
dfx stop
