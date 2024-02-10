# Admin DFX setup

## Cloning the repository

DFX commands are run from the root `codegov-website` repository. The repository contains information that is useful to DFX when running these commands.

- `dfx.json` informs DFX of the names that have been assigned to canisters and where the canister's Candid files are located.
- Canister name
  - `backend` is the name assigned to the primary canister that is used to store user (reviewers, admins, etc...) and proposal information.
  - DFX will use this canister name when running commands to determine which canister ID the request should be routed to.
- Canister interface
  - `src/backend/api/backend.did` is the Candid file for the `backend` canister's interface.
  - DFX will use this Candid interface definition when encoding requests and decoding responses.
- `canister_ids.json` lists the canister IDs on mainnet.

To clone the repository, run the following command:

```bash
git clone https://github.com/CodeGov-org/codegov-website.git
```

Once the repository is cloned, change directory to the root of the repository:

```bash
cd codegov-website
```

## DFX version management

The project requires a specific version of DFX to be installed when running these commands. The easiest way to ensure that DFX is always on the correct version is to use `dfxvm`.

To install `dfxvm`, run the following command in any folder:

```bash
sh -ci "$(curl -fsSL https://raw.githubusercontent.com/dfinity/sdk/dfxvm-install-script/install.sh)"
```

Once it's installed, restart the current shell to proceed with using `dfxvm`.

When running a `dfx` command inside the project, if the correct version is not installed, `dfxvm` will throw an error and display a command that can be used to install the correct version.

For example:

```bash
error: dfx 0.16.1 is not installed.  To install it, run:
error:     dfxvm install 0.16.1
```

In this case, the `dfxvm install 0.16.1` command should be run to install the correct version.

## Using a DFX identity

### Listing available DFX identities

To see the list of available DFX identities, run the following command:

```bash
dfx identity list
```

The current active identity will be marked with an asterisk `*`.

### Selecting a specific DFX identity

To use a specific identity, run the following command:

- Replace `${identityName}` with the name of the identity that should be used.

```bash
dfx identity use ${identityName}
```

### Running a command with a specific DFX identity

Alternatively, the `--identity` flag can be used to specify the identity to use when running a command. For example:

- Replace `${identityName}` with the name of the identity that should be used when running this command.
- The overall anatomy of this command is explained later in the [Anatomy of a DFX command](#anatomy-of-a-dfx-command) section.

```bash
dfx canister call backend --ic --identity=${identityName} get_my_user_profile
```

When using the `--identity` flag, DFX will switch to the selected identity, run the command and then switch back to the current identity.

## Setting up a new DFX identity

When interacting with canisters deployed on mainnet, it is recommended not to use the default identity that is created with the DFX installation. A new identity can be created specifically for this project, or an existing non-default identity can be used. If there is already an identity available that is not the default, this section can be skipped.

New identities can be password protected or stored in plaintext. If the identity is password protected, then the password will need to be entered each time a command is run using that identity.

### Creating a plaintext identity

To create an identity that is stored in plaintext, run the following command:

- Replace `${identityName}` with the desired name of the identity to be created.

```bash
dfx identity new --storage-mode plaintext ${identityName}
```

### Creating a password protected identity

To create an identity that will be password protected, run the following command:

- Replace `${identityName}` with the desired name of the identity to be created.

```bash
dfx identity new ${identityName}
```

## Importing and exporting DFX identities

### Exporting an identity

To export a DFX identity, run the following command:

- Replace `${identityName}` with the name of the identity that should be exported.
- Replace `${exportPath}` with the path to the file where the identity should be exported to. For example, `./identity.pem`.

```bash
dfx identity export ${identityName} > ${exportPath}
```

The exported `.pem` file can be stored in a safe location to back up the identity.

### Importing an identity

Imported identities can be password protected or stored in plaintext. If the identity is password protected, then the password will need to be entered each time a command is run using that identity.

### Importing a plaintext identity

To import a DFX identity in plaintext, run the following command:

- Replace `${identityName}` with the desired name of the identity that should be imported.
- Replace `${importPath}` with the path to a `.pem` file. For example, `./identity.pem`.

```bash
dfx identity import --storage-mode plaintext ${identityName} ${importPath}
```

### Importing a password protected identity

To import a DFX identity and password protect it, run the following command:

- Replace `${identityName}` with the desired name of the identity that should be imported.
- Replace `${exportPath}` with the path to a `.pem` file. For example, `./identity.pem`.

```bash
dfx identity import ${identityName} ${importPath}
```

### Removing an identity

To remove an identity, run the following command:

- Replace `${identityName}` with the name of the identity that should be removed.

```bash
dfx identity remove ${identityName}
```

### Renaming an identity

To rename an identity, run the following command:

- Replace `${oldIdentityName}` with the current name of the identity.
- Replace `${newIdentityName}` with the new name of the identity.

```bash
dfx identity rename ${oldIdentityName} ${newIdentityName}
```

## Anatomy of a DFX command

When calling canisters using DFX, the command will have the following structure:

- `--ic` tells DFX to make this call against mainnet.
  - If this flag is not present, the call will be made against the local replica.
- `--identity ${identityName}` specifies the identity to use when making the call.
  - If this flag is not present, the current active identity will be used.
  - The current active identity can be set using `dfx identity use ${identityName}`.
  - `${identityName}` should be replaced with the name of the identity that should be used.
- `${canisterName}` is the name of the canister that the call should be made against.
  - For now, this will always be `backend`.
- `${functionName}` is the name of the function that should be called on the canister.
- `${requestArgument}` is the argument that should be passed to the function.
  - The value of this argument will be Candid textual encoding.

```bash
dfx canister call --ic --identity ${identityName} ${canisterName} ${functionName} '${requestArgument}'
```
