---
title: Consensus Overview
description: Prepare for reviewing consensus layer Internet Computer Protocol replica upgrades
---

## Scope

- Consensus crate
- Artifact pool
- Chain key technology
- Ingress manager
- Orchestrator
- Ic-replay
- Upgrades
- Subnet recovery
- Subnet backup
- Subnet splitting

## Summary

- The consensus layer receives unordered messages from the P2P layer.
- Consensus achieves agreement as to which messages and in which order the IC should execute.
- It can do this as long as more than ⅔ of the nodes are honest and functioning well.

## Resources

- Consensus
  - [YouTube: Inside the Internet Computer | Consensus Overview](https://www.youtube.com/watch?v=vVLRRYh3JYo)
  - [Medium: Achieving Consensus on the Internet Computer](https://medium.com/dfinity/achieving-consensus-on-the-internet-computer-ee9fbfbafcbc)
  - [Internet Computer: Consensus](https://internetcomputer.org/how-it-works/consensus/)
  - [Internet Computer Wiki: Consensus](https://wiki.internetcomputer.org/wiki/IC_consensus_layer)
  - Chapter 5 of the [Internet Computer Whitepaper](https://internetcomputer.org/whitepaper.pdf)
  - [Consensus Whitepaper](https://eprint.iacr.org/2021/632.pdf)
  - [Consensus Extended Whitepaper](https://assets.ctfassets.net/ywqk17d3hsnp/1Gutwfrd1lMgiUBJZGCdUG/d3ea7730aba0a4b793741681463239f5/podc-2022-cr.pdf)
- Chain Key Cryptography
  - [YouTube: Inside the Internet Computer | Chain Key Cryptography](https://www.youtube.com/watch?v=vUcDRFC09J0)
  - [Internet Computer: Chain Key Cryptography](https://internetcomputer.org/how-it-works/chain-key-technology)
  - [Medium: Chain Key Cryptography](https://medium.com/dfinity/chain-key-technology-one-public-key-for-the-internet-computer-6a3644901e28)
- Non-Interactive Distributed Key Generation (NIDKG)
  - [YouTube: Inside the Internet Computer | NIDKG](https://www.youtube.com/watch?v=gKUi-2T7tdc)
  - [Medium: NIDKG](https://medium.com/dfinity/applied-crypto-one-public-key-for-the-internet-computer-ni-dkg-4af800db869d)
  - [NIDKG Whitepaper](https://eprint.iacr.org/2021/339.pdf)
- [GitHub: Orchestrator Docs](https://github.com/dfinity/ic/tree/master/rs/orchestrator)

## Codebase

- Testnet
  - [NNS State Deployment](https://github.com/dfinity/ic/blob/master/testnet/tools/nns_state_deployment.sh)
  - [NNS State Deployment Script](https://github.com/dfinity/ic/blob/master/testnet/tests/scripts/nns_state_deployment_test.sh)
- [Artifact Pool](https://github.com/dfinity/ic/tree/master/rs/artifact_pool)
- [Backup](https://github.com/dfinity/ic/tree/master/rs/backup)
- Consensus
  - [Consensus](https://github.com/dfinity/ic/tree/master/rs/consensus)
  - [Consensus Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/consensus.rs)
  - [Consensus Pool Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/consensus_pool.rs)
  - [Consensus Types](https://github.com/dfinity/ic/blob/master/rs/types/types/src/consensus.rs)
  - [More Consensus Types](https://github.com/dfinity/ic/tree/master/rs/types/types/src/consensus)
- Canister HTTP
  - [Canister HTTP Protobuf Definition](https://github.com/dfinity/ic/tree/master/rs/protobuf/def/canister_http)
  - [Canister HTTP Protobuf Generator](https://github.com/dfinity/ic/tree/master/rs/protobuf/src/gen/canister_http)
- [DKG Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/dkg.rs)
- [Ingress Manager](https://github.com/dfinity/ic/tree/master/rs/ingress_manager)
- [Canister HTTP Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/canister_http.rs)
- [Orchestrator](https://github.com/dfinity/ic/tree/master/rs/orchestrator)
- [Recovery](https://github.com/dfinity/ic/tree/master/rs/recovery)
- [Registry (NNS) Subnet Helper](https://github.com/dfinity/ic/blob/master/rs/registry/helpers/src/subnet.rs)
- [Registry (NNS) Unassigned Nodes helper](https://github.com/dfinity/ic/blob/master/rs/registry/helpers/src/unassigned_nodes.rs)
- [Replay](https://github.com/dfinity/ic/tree/master/rs/replay)
- Tests
  - [Consensus Tests](https://github.com/dfinity/ic/tree/master/rs/tests/consensus)
  - [More Consensus Tests](https://github.com/dfinity/ic/tree/master/rs/tests/src/consensus)
  - [HTTP Canister Basic Tests](https://github.com/dfinity/ic/blob/master/rs/tests/src/canister_http/http_basic.rs)
  - [Orchestrator Tests](https://github.com/dfinity/ic/tree/master/rs/tests/src/orchestrator)
  - [tECDSA Tests](https://github.com/dfinity/ic/tree/master/rs/tests/src/tecdsa)
