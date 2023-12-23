---
title: Crypto Overview
description: Prepare for reviewing crypto Internet Computer Protocol replica upgrades
---

## Scope

- Crypto component
- Reusable crypto libraries

## Summary

- The crypto component:
  - Provides consistent APIs for cryptographic functions
  - Used by other components of the replica's stack
  - Provides secure storage and generation of secret keys
- The crypto component consists of two main pieces:
  - External API: Identifier to Key Mapping (IDKM)
    - Stores node public keys
    - Stores threshold signature public keys
    - Called using node identifiers
    - Maps node identifiers to the appropriate keys and algorithms
    - Fetches public keys of other nodes from the Registry canister on the NNS subnet
  - Internal API: Crypto Service Provider (CSP)
    - Generates and stores secret keys
    - Called using node identifiers and secret key IDs
    - Performs cryptographic operations

## Resources

- Chain Key Cryptography
  - [YouTube: Inside the Internet Computer | Chain Key Cryptography](https://www.youtube.com/watch?v=vUcDRFC09J0)
  - [Internet Computer: Chain Key Cryptography](https://internetcomputer.org/how-it-works/chain-key-technology)
  - [Medium: Chain Key Cryptography](https://medium.com/dfinity/chain-key-technology-one-public-key-for-the-internet-computer-6a3644901e28)
- Non-Interactive Distributed Key Generation (NIDKG)
  - [YouTube: Inside the Internet Computer | NIDKG](https://www.youtube.com/watch?v=gKUi-2T7tdc)
  - [Medium: NIDKG](https://medium.com/dfinity/applied-crypto-one-public-key-for-the-internet-computer-ni-dkg-4af800db869d)
  - [NIDKG Whitepaper](https://eprint.iacr.org/2021/339.pdf)

## Codebase

- [Hash Tree](https://github.com/dfinity/ic/blob/master/rs/canonical_state/src/hash_tree.rs)
- [Hash Tree Tests](https://github.com/dfinity/ic/tree/master/rs/canonical_state/src/hash_tree)
- [Certification](https://github.com/dfinity/ic/tree/master/rs/certification)
- [The crypto component and crypto libraries](https://github.com/dfinity/ic/tree/master/rs/crypto)
- [Crypto interfaces (mod)](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/crypto.rs)
- [Crypto interfaces (crate)](https://github.com/dfinity/ic/tree/master/rs/interfaces/src/crypto)
- [Crypto Protobuf definition](https://github.com/dfinity/ic/tree/master/rs/protobuf/def/crypto)
- [Crypto Protobuf generator](https://github.com/dfinity/ic/tree/master/rs/protobuf/src/gen/crypto)
- [Registry (NNS) crypto helper](https://github.com/dfinity/ic/blob/master/rs/registry/helpers/src/crypto.rs)
- [Registry (NNS) crypto helper tests](https://github.com/dfinity/ic/tree/master/rs/registry/helpers/src/crypto)
- [Crypto test utilities](https://github.com/dfinity/ic/blob/master/rs/test_utilities/src/crypto.rs)
- [More crypto test utilities](https://github.com/dfinity/ic/tree/master/rs/test_utilities/src/crypto)
- [Crypto tests](https://github.com/dfinity/ic/tree/master/rs/tests/crypto)
- [Canister signature verification test](https://github.com/dfinity/ic/tree/master/rs/tests/src/canister_sig_verification_cache_test)
- [More crypto tests](https://github.com/dfinity/ic/tree/master/rs/tests/src/crypto)
- [Crypto types](https://github.com/dfinity/ic/blob/master/rs/types/types/src/crypto.rs)
- [More crypto types](https://github.com/dfinity/ic/tree/master/rs/types/types/src/crypto)
- [Validator](https://github.com/dfinity/ic/tree/master/rs/validator)
