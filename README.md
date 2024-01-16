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

Enable `.bashrc` changes in your current shell:

```bash
source ~/.bashrc
```

Install system dependencies (Linux):

```bash
sudo apt install -y unzip jq
```

Run the system setup script.

_WARNING!_ This script will install software on your system, please review it before running it. Most notably, it will reinstall DFX and wipe out any local state that you have. Follow the steps manually if you don't want to lose state or if you prefer to install the software manually:

```bash
./scripts/system-setup.sh
```

Install NPM dependencies:

```bash
pnpm i
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
