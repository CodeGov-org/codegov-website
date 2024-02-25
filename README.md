# CodeGov Website

## Project reference

If this is the first time setting up this project, follow the steps in the [System Setup](#system-setup) section.

Every other time, make sure that `dfx` is running.
If you want to run it within the same terminal:

```bash
dfx start --background
```

If you would prefer to run it in a separate terminal:

```bash
dfx start
```

To deploy all canisters at once:

```bash
dfx deploy
```

Else, refer to the following sections.

### Marketing

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `dfx deploy marketing`          | Deploy to a local DFX replica  |
| `pnpm turbo start -F marketing` | Run a local development server |

### Frontend

| Command                        | Description                    |
| ------------------------------ | ------------------------------ |
| `dfx deploy frontend`          | Deploy to a local DFX replica  |
| `pnpm turbo start -F frontend` | Run a local development server |
| `pnpm turbo test -F frontend`  | Run unit tests                 |

### Docs

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `dfx deploy docs`          | Deploy to a local DFX replica  |
| `pnpm turbo start -F docs` | Run a local development server |

### Backend

The primary backend canister for CodeGov proposal review management.

| Command                                  | Description                   |
| ---------------------------------------- | ----------------------------- |
| `dfx deploy backend`                     | Deploy to a local DFX replica |
| `cargo test`                             | Run unit tests                |
| `pnpm turbo test -F backend-integration` | Run integration tests         |

### NNS Testing

An NNS testing utility tool.

This tool currently supports:

- Random identity generation
- Neuron staking
- RVM proposal creation

All supported actions are performed through self-documenting prompts in the terminal window.

| Command                     | Description  |
| --------------------------- | ------------ |
| `pnpm -F nns-testing start` | Run the tool |

## System Setup

Add the following to the `~/.bashrc` (or `.zprofile` on Mac) file:

```bash
# bin
export PATH="~/bin:$PATH"
```

Additionally add the following to `.zprofile` (Mac only):

```bash
# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

Enable `.bashrc` (or `.zprofile` on Mac) changes in your current shell:

```bash
source ~/.bashrc
```

Install Homebrew (Mac only):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install system dependencies (Mac only):

```bash
brew install jq wget
```

Install system dependencies (Linux only):

```bash
sudo apt install -y unzip jq
```

_WARNING!_ The following setup script will install software on your system, please review it before running it. Most notably, it will reinstall DFX and wipe out any local state that you have. Follow the steps manually if you don't want to lose state or if you prefer to install the software manually. This will not affect any global or other project-specific networks. Running this script multiple times will not cause any issues and can be used to update the software it installs or to clean up the local project state.

The system setup script installs `dfxvm` to manage versions of DFX. If `dfxvm` is already installed, it will be updated to the latest version.

If `dfx` is installed, but `dfxvm` is not, it's recommended to uninstall `dfx` first. This can be done by running the following (this will affect any global or other project-specific networks):

```bash
~/.cache/dfinity/uninstall.sh
```

Run the system setup script.

Note:

- `fnm` will warn about missing environment variables, this is fine.
- The script may also pause execution to prompt for an administrator password.

```bash
./scripts/system-setup.sh
```

Add the following to the `~/.bashrc` (or `.zprofile` on Mac) file:

```bash
# fnm
export PATH="~/.fnm:$PATH"
eval "$(fnm env --use-on-cd)"
```

Enable `.bashrc` (or `.zprofile` on Mac) changes in your current shell:

```bash
source ~/.bashrc
```

Additionaly, on Mac, run:

```bash
source "$HOME/Library/Application Support/org.dfinity.dfx/env"
```

Install NPM dependencies:

```bash
pnpm i
```

Create a `src/marketing/.env` file with the following contents:

```bash
STORYBLOK_TOKEN=YOUR_PREVIEW_TOKEN
```

Create a `src/frontend/.env` file with the following contents:

```bash
STORYBLOK_TOKEN=YOUR_PREVIEW_TOKEN
```

### WSL

#### Google Chrome

A Google Chrome installation is required to run Angular unit tests in WSL. Google Chrome installation instructions are based on those provided by [Microsoft](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps#install-google-chrome-for-linux).

Change directory to temporary folder:

```shell
cd /tmp
```

Download the latest stable Google Chrome:

```shell
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
```

Install the downloaded package:

```shell
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

Fix the package:

```shell
sudo apt install --fix-broken -y
```

Configure the package:

```shell
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

Test the installation by running Google Chrome:

```shell
google-chrome
```

## Using DFX

### Managing Users

The controller of the canister has an admin role assigned to it when the canister is deployed for the first time. This role can be used to manage other users. The controller of the canister is whatever identity is selected when the canister is first deployed. Using the `default` identity is recommended for this purpose locally for simplicity.

The user must exist before they can be assigned a role. To create another user, first create a new identity with DFX with the following command, replacing `${identityName}` with a name of your choice. `--storage-mode plaintext` is optional, but easier to use when simply testing locally. The default storage mode will require a password every time a call is made with that identity.

```bash
dfx identity new --storage-mode plaintext ${identityName}
```

To view all of the identities that have been created, and also the current selected identity (it will have an `*` next to it), run:

```bash
dfx identity list
```

To select your new identity, run:

```bash
dfx identity use ${identityName}
```

To then create a profile for this identity, run the following command. This command will return the ID of the profile that was created. This ID is needed to assign roles to the user.

```bash
dfx canister call backend create_my_user_profile
```

To get the profile (including the `id`) of the current identity at any other time, run:

```bash
dfx canister call backend get_my_user_profile
```

Before changing the role of this user, switch back to the controller identity:

```bash
dfx identity use default
```

To assign a user as an admin, run the following command:

- Replace `${userId}` with the ID of the profile that was created earlier.
- Replace `${username}` with this user's username.
- Replace `${bio}` with this user's bio.

```bash
dfx canister call backend update_user_profile '(record { user_id = "${userId}"; username = opt "${username}"; config = opt variant { admin = record { bio = opt "${bio}" } } })'
```

To assign a user as a reviewer, run the following command:

- Replace `${userId}` with the ID of the profile that was created earlier.
- Replace `${username}` with this user's username.
- Replace `${bio}` with this user's bio.
- Replace `${neuronId}` with the neuron ID of the neuron that this user will use to vote.
- Replace `${walletAddress}` with the wallet address that this user will use to receive bounties.

Valid values for `neuronId` and `walletAddress` can be found on the [Internet Computer dashboard](https://dashboard.internetcomputer.org/).

```bash
dfx canister call backend update_user_profile '(record { user_id = "${userId}"; username = opt "${username}"; config = opt variant { reviewer = record { bio = opt "${bio}"; neuron_id = opt ${neuronId}; wallet_address = opt "${walletAddress}" } } })'
```

Any property preceded by `opt` is optional and can be omitted. For example, to only change the username of a user:

```bash
dfx canister call backend update_user_profile '(record { user_id = "${userId}"; username = opt "${username}"; })'
```

### Listing open proposals

To list open replica version management proposals:

```bash
./scripts/list-open-rvm-proposals.sh
```

### Creating proposals

- The method to call on the NNS governance canister is [`manage_neuron`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L679).
- This method takes a [`ManageNeuron`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L300-L304) record as an argument.
  - `id` is optional and can be omitted.
  - `neuron_id_or_subaccount` should be the ID of the proposing neuron using a [`NeuronIdOrSubaccount::NeuronId`] record.
  - `command` takes a [`Command::MakeProposal`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L62-L75) variant as a value.
- `Command::MakeProposal` takes a [`Proposal`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L484-L489) record as its value.
  - `url` can be an empty string.
  - `title` is the title of the proposal.
  - `summary` is the summary of the proposal.
  - `action` is the most important property and determines the type of proposal, it takes an [`Action`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L2-L16) variant as its value.
- The [`Action::ExecuteNnsFunction`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L6) variant can execute several different NNS function. It takes the identically named [`ExecuteNnsFunction`](https://github.com/dfinity/ic/blob/046de5375825975b57ca3a6f92cd80eaf062f21a/rs/nns/governance/canister/governance.did#L149) record as a value.
  - `nns_function` is a number corresponding to the NNS function to execute. The mapping between numbers and NNS functions can be found in the [`NnsFunction`](https://github.com/dfinity/ic/blob/master/rs/nns/governance/src/gen/ic_nns_governance.pb.v1.rs#L3440-L3612) enum.
  - `payload` is the Candid encoded argument for the corresponding NNS function. The types for this argument can be found in the appropriate canister's declaration. A mapping between NNS functions and their corresponding canisters can be found in the [`NnsFunction::canister_and_function`](https://github.com/dfinity/ic/blob/master/rs/nns/governance/src/governance.rs#L527-L631) function definition.
  - For example, the `UpdateElectedReplicaVersions` uses number `38` and its payload is the [`UpdateElectedReplicaVersionsPayload`](https://github.com/dfinity/ic/blob/master/rs/registry/canister/canister/registry.did#L217-L223) record.

### Manually syncing proposals

To manually trigger the proposals synchronization from the Nervous Systems, run the following command:

```bash
dfx canister call backend sync_proposals
```

This method can be called at any time, since if the proposals were already synced in the cron job, they won't be synced again.
