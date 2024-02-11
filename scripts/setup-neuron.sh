mkdir -p ./data

# Make sure the local minter is setup
./scripts/setup-minter.sh

# Setup the proposer identity, this will override any existing identity with the same name
quill generate \
  --seed-file ./data/proposer.txt --overwrite-seed-file \
  --pem-file ./data/proposer.pem --overwrite-pem-file

dfx identity import \
  --force \
  --storage-mode plaintext \
  cg-test-proposer ./data/proposer.pem

# Start DFX
dfx start --background
IC_URL=http://localhost:$(dfx info replica-port)

# Get the proposer account Id
ACCOUNT_ID=$(dfx --identity cg-test-proposer ledger account-id)

# Transfer funds to the proposer account
dfx ledger --identity cg-test-minter transfer --icp 100 --memo 0 $ACCOUNT_ID

function local_quill {
  IC_URL=$IC_URL quill --insecure-local-dev-mode --pem-file ./data/proposer.pem $@
}

# Stake neuron
local_quill neuron-stake --name cg-test --amount 10 > ./data/neuron-stake.json
local_quill send ./data/neuron-stake.json -y > ./data/neuron-state-output.txt

# Get neuron ID
NEURON_ID=$( \
  grep -o 'id = [0-9_]*' ./data/neuron-state-output.txt \
  | tr -d 'id =_' \
)

# Increase the dissolve delay
local_quill neuron-manage $NEURON_ID \
  --additional-dissolve-delay-seconds 31557600 \
  > ./data/increase-dissolve-delay.json

local_quill send ./data/increase-dissolve-delay.json -y

cat <<EOF >./data/info.txt
ACCOUNT_ID=$ACCOUNT_ID
NEURON_ID=$NEURON_ID
EOF
