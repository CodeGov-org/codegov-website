---
title: Threshold ECDSA
description: Threshold ECDSA enables canisters to sign messages using ECDSA signatures.
---

## Summary

Enbling canisters to sign messages using ECDSA signatures allows them to own native assets from other blockchains and to programmatically transfer them. However, a canister cannot hold the secret key itself as it would otherwise be readable from the canister state (which node providers might have access to). Therefore, the private key has to be secret shared among the replicas of a subnet and replicas have to be able to sign messages without ever reconstructing the private key.

## Implementation

The Threshold ECDSA feature is composed of multiple subprotocols beyond the actual signign:

- key generation
- Xnet key resharing
- periodic key resharing
- presignatures computation
- signing
- public key retrieval

For more information about the subprotocols, check [this](https://internetcomputer.org/docs/current/references/t-ecdsa-how-it-works) out. The first three subprotocols are mostly focused on the initial key setup and resharing to prevent the shares from slowly being acquired by an adversary. The computation of the presignatures happens continuously and it's independent of the signing requests. This is done in order to reduce the latency of signing a message as part of the computation is performed in the background. The signing and public key retrieval are triggered by the canister via the API calls `sign_with_ecdsa`and `ecdsa_public_key`.

The creation of threshold ECDSA signatures is based on five transcripts:

- `ecdsa_key`: shares the ECDSA secret signing key `x`
- `lambda_masked`: shares the ephemeral random values `l`
- `kappa_masked`: shares the ephemeral random values `k`
- `kappa_times_lambda`: shares the product `k * l`
- `key_times_lambda`: shares the product `x * l`

The consensus layer orchestrates the creation of these transcripts. Each block contains configs (also called params) which indicate which transcripts should be created.

The [ECDSAImpl](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa.rs#L235C1-L248C2) component is responsible for adding artifacts to the ECDSA artifact pool and validating them. This is driven by the consensus main loop which periodically triggers the `on_state_change` method on each consensus subcomponent.
When `ECDSAImpl`'s [on_state_change](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa.rs#L371C5-L424C6) is called, first the `EcdsaPreSignerImpl` is [triggered](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa/pre_signer.rs#L917C5-L976C6) in order to [create](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/crypto/src/sign/canister_threshold_sig/idkg.rs#L202C5-L238C6) and [verify](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/crypto/src/sign/canister_threshold_sig/idkg.rs#L240C5-L276C6) dealings for new transcripts. Then the [on_state_change](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa/signer.rs#L391C5-L450C6) of `EcdsaSignerImpl` is also called. This checks which ECDSA signing requests have been made by the canisters by [reading the replicated state](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa/signer.rs#L404C9-L412C64). Once a signing request is matched to a presignature, a [signature share is created](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa/signer.rs#L424C9-L437C11), the replicas receiving such a share have to [validate it](https://github.com/dfinity/ic/blob/7a9d8f6642a417b7b40d69101a57db2e02445530/rs/consensus/src/ecdsa/signer.rs#L438C9-L444C11) before they can consider it for reconstructing the actual ECDSA signature.
