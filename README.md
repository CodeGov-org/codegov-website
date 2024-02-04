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

| Command                      | Description                    |
| ---------------------------- | ------------------------------ |
| `dfx deploy marketing`       | Deploy to a local DFX replica  |
| `pnpm -F marketing... start` | Run a local development server |

### Frontend

| Command                     | Description                    |
| --------------------------- | ------------------------------ |
| `dfx deploy frontend`       | Deploy to a local DFX replica  |
| `pnpm -F frontend... start` | Run a local development server |

### Docs

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `dfx deploy docs`       | Deploy to a local DFX replica  |
| `pnpm -F docs... start` | Run a local development server |

### Backend

The primary backend canister for CodeGov proposal review management.

| Command                       | Description                               |
| ----------------------------- | ----------------------------------------- |
| `dfx deploy backend`          | Deploy to a local DFX replica             |
| `pnpm -F @cg/backend build`   | Generate TS/JS bindings for this canister |
| `pnpm -F backend-integration` | Run integration tests                     |

## System Setup

Add the following to `~/.bashrc`:

```bash
# fnm
export PATH="~/.fnm:$PATH"
eval "$(fnm env --use-on-cd)"
```

Install system dependencies (Linux):

```bash
sudo apt install -y unzip jq
```

_WARNING!_ The following setup script will install software on your system, please review it before running it. Most notably, it will reinstall DFX and wipe out any local state that you have. Follow the steps manually if you don't want to lose state or if you prefer to install the software manually. This will not affect any global or other project-specific networks. Running this script multiple times will not cause any issues and can be used to update the software it installs or to clean up the local project state.

The system setup script installs `dfxvm` to manage versions of DFX. If `dfxvm` is already installed, it will be updated to the latest version.

If `dfx` is installed, but `dfxvm` is not, it's recommended to uninstall `dfx` first. This can be done by running the following (this will affect any global or other project-specific networks):

```bash
~/.cache/dfinity/uninstall.sh
```

Run the system setup script:

```bash
./scripts/system-setup.sh
```

Enable `.bashrc` changes in your current shell:

```bash
source ~/.bashrc
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
