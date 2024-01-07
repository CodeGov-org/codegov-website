# CodeGov Website

## Project reference

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

Run the system setup script.

_WARNING!_ This script will install software on your system, please review it before running it. Most notably, it will reinstall DFX and wipe out any local state that you have. Follow the steps manually if you don't want to lose state or if you prefer to install the software manually:

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
