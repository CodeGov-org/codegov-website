# Admin DFX commands

## Creating a profile

A profile needs to be created before any other commands can be used. To create a profile, run the following command using the desired DFX identity:

- Replace `${identityName}` with the name of the identity that should be used to create the profile.

```bash
dfx canister call --ic --identity ${identityName} backend create_my_user_profile
```

Running this command will result in output similar to the following:

- `${userId}` will be replaced by the user ID of the newly created profile.

```
(
  variant {
    ok = record {
      id = "${userId}";
      username = "Anonymous";
      config = variant { anonymous };
    }
  },
)
```

The default user profile setup is anonymous and does not grant access to perform any actions within the application. To have admin access granted to this user profile, provide the user ID to someone else with admin privileges. The deployer of the canister will have admin privileges by default.

## Getting profile information

With a profile created, the following command can be used to get the profile information at any time:

- Replace `${identityName}` with the name of the identity that should be used to get the profile information.

```bash
dfx canister call --ic --identity ${identityName} backend get_my_user_profile
```

Running this command will result in output similar to the following:

- `${userId}` will be replaced by the user ID of the newly created profile.

```
(
  variant {
    ok = record {
      id = "${userId}";
      username = "Anonymous";
      config = variant { anonymous };
    }
  },
)
```

## Granting admin privileges

To grant admin privileges to a user profile, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to grant admin privileges.
- Replace `${userId}` with the user ID of the profile that should be granted admin privileges.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      admin = record {}
    }
  }
)'
```

## Granting reviewer privileges

To grant reviewer privileges to a user profile, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to grant reviewer privileges.
- Replace `${userId}` with the user ID of the profile that should be granted reviewer privileges.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      reviewer = record {}
    }
  }
)'
```

## Setting another user's username

To change the username of another user, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the username.
- Replace `${userId}` with the user ID of the profile that should have the username changed.
- Replace `${username}` with the new username for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    username = opt "${username}";
  }
)'
```

## Managing other admin users

### Setting admin bio

To change the bio of another admin user, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the bio.
- Replace `${userId}` with the user ID of the profile that should have the bio changed.
- Replace `${bio}` with the new bio for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      admin = record {
        bio = opt "${bio}"
      }
    }
  }
)'
```

This command will also change the role of a user to admin, if it is not already set.

### Setting all admin attributes

To change all attributes of another admin user in a single command, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the attributes.
- Replace `${userId}` with the user ID of the profile that should have the attributes changed.
- Replace `${username}` with the new username for the user.
- Replace `${bio}` with the new bio for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    username = opt "${username}";
    config = opt variant {
      admin = record {
        bio = opt "${bio}"
      }
    }
  }
)'
```

This command will also change the role of a user to admin, if it is not already set.

## Managing other reviewer users

### Setting reviewer bio

To change the bio of another reviewer user, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the bio.
- Replace `${userId}` with the user ID of the profile that should have the bio changed.
- Replace `${bio}` with the new bio for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      reviewer = record {
        bio = opt "${bio}"
      }
    }
  }
)'
```

This command will also change the role of a user to reviewer, if it is not already set.

### Setting reviewer neuron ID

To change the neuron ID of another reviewer user, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the neuron ID.
- Replace `${userId}` with the user ID of the profile that should have the neuron ID changed.
- Replace `${neuronId}` with the new neuron ID for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      reviewer = record {
        neuron_id = opt "${neuronId}"
      }
    }
  }
)'
```

This command will also change the role of a user to reviewer, if it is not already set.

### Setting reviewer wallet address

To change the wallet address of another reviewer user, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the wallet address.
- Replace `${userId}` with the user ID of the profile that should have the wallet address changed.
- Replace `${walletAddress}` with the new wallet address for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    config = opt variant {
      reviewer = record {
        wallet_address = opt "${walletAddress}"
      }
    }
  }
)'
```

This command will also change the role of a user to reviewer, if it is not already set.

### Setting all reviewer attributes

To change all attributes of another reviewer user in a single command, run the following command using an identity that has admin privileges:

- Replace `${identityName}` with the name of the identity that should be used to change the attributes.
- Replace `${userId}` with the user ID of the profile that should have the attributes changed.
- Replace `${username}` with the new username for the user.
- Replace `${bio}` with the new bio for the user.
- Replace `${neuronId}` with the new neuron ID for the user.
- Replace `${walletAddress}` with the new wallet address for the user.

```bash
dfx canister call --ic --identity ${identityName} backend update_user_profile '(
  record {
    user_id = "${userId}";
    username = opt "${username}";
    config = opt variant {
      reviewer = record {
        bio = opt "${bio}";
        neuron_id = opt "${neuronId}";
        wallet_address = opt "${walletAddress}"
      }
    }
  }
)'
```

This command will also change the role of a user to reviewer, if it is not already set.

## Managing own profile

Since admin commands are run through DFX, admins can generally not use the UI to change profile attributes. DFX commands must also be used to change the attributes of the admin's own profile.

### Setting own username

To change the username of an admin's own profile, run the following command using the admin's identity:

- Replace `${identityName}` with the name of the admin's identity.
- Replace `${username}` with the new username for the admin.

```bash
dfx canister call --ic --identity ${identityName} backend update_my_user_profile '(
  record {
    username = opt "${username}";
  }
)'
```

This command cannot be used to change the role of the admin.

### Setting own bio

To change the bio of an admin's own profile, run the following command using the admin's identity:

- Replace `${identityName}` with the name of the admin's identity.
- Replace `${bio}` with the new bio for the admin.

```bash
dfx canister call --ic --identity ${identityName} backend update_my_user_profile '(
  record {
    config = opt variant {
      admin = record {
        bio = opt "${bio}"
      }
    }
  }
)'
```

This command cannot be used to change the role of the admin.

### Setting all own attributes

To change all attributes of an admin's own profile in a single command, run the following command using the admin's identity:

- Replace `${identityName}` with the name of the admin's identity.
- Replace `${username}` with the new username for the admin.
- Replace `${bio}` with the new bio for the admin.

```bash
dfx canister call --ic --identity ${identityName} backend update_my_user_profile '(
  record {
    username = opt "${username}";
    config = opt variant {
      admin = record {
        bio = opt "${bio}"
      }
    }
  }
)'
```

This command cannot be used to change the role of the admin.

### Getting own profile history

To get the history of changes to an admin's own profile, run the following command using the admin's identity:

- Replace `${identityName}` with the name of the admin's identity.

```bash
dfx canister call --ic --identity ${identityName} backend get_my_user_profile_history
```
