---
title: Networking Overview
description: Prepare for reviewing peer-to-peer layer Internet Computer Protocol replica upgrades
---

## Scope

- P2P/Gossip/Transport
- HTTP(S) endpoints
- HTTPS outcalls
- Bitcoin Adapter
- NNS Managed Firewall Configuration

## Summary

- P2P (Peer-to-Peer) constitutes the lowest layer, taking care of disseminating information.
- Make information available at one IC node to reach other IC nodes efficiently.
- Networking adapters
  - Networking adapters are processes on the GuestOS that run next to the main replica process and can issue outgoing calls to the internet.
  - An adapter intends to serve as a proxy that sanitizes data received externally.
  - Networking adapters are used by the Bitcoin integration and HTTPS outcalls feature.
  - The main replica process uses gRPC for communicating with the co-located adapters via Unix domain sockets.

## Resources

- How it works
  - [Internet Computer Docs: Fault Tolerance](https://internetcomputer.org/how-it-works/fault-tolerance/)
  - [Internet Computer Docs: Protocol Upgrades](https://internetcomputer.org/how-it-works/upgrades/)
- Inside the Internet Computer
  - [YouTube: Inside the Internet Computer | Resumption](https://www.youtube.com/watch?v=H7HCqonSMFU)
  - [YouTube: Inside the Internet Computer | State Synchronization](https://www.youtube.com/watch?v=WaNJINjGleg)
  - [YouTube: Inside the Internet Computer | Upgrades](https://www.youtube.com/watch?v=mPjiO2bk2lI)
- [GitHub: HTTPS Endpoint - High-level design](https://github.com/dfinity/ic/tree/master/rs/http_endpoints)
- [GitHub: Public HTTPS Endpoint](https://github.com/dfinity/ic/tree/master/rs/http_endpoints/public)
- Chapter 4 of the [Whitepaper](https://internetcomputer.org/whitepaper.pdf)
- [YouTube: Firewalls with NFtables](https://www.youtube.com/watch?v=EGKhIljDPCw)
- Rate limiting
  - [Google Cloud: Rate-limiting strategies and techniques](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
  - [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [GRPC: Deadlines](https://grpc.io/blog/deadlines/)
- [web.dev: Introduction to HTTP2](https://web.dev/performance-http2/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/): See chapters 19, 20, 21 and 22
- [Medium: Understanding socket and port in TCP](https://medium.com/fantageek/understanding-socket-and-port-in-tcp-2213dc2e9b0c)
- [Tonic: Rust server and client implementation](https://docs.rs/tonic/latest/tonic/transport/index.html)

## Codebase

- HTTPS Outcalls
  - [HTTPS Outcalls](https://github.com/dfinity/ic/tree/master/rs/https_outcalls)
  - [HTTPS Outcalls Adapter Client Interface](https://github.com/dfinity/ic/tree/master/rs/interfaces/https_outcalls_adapter_client)
- Artifact Manager
  - [Artifact Manager](https://github.com/dfinity/ic/tree/master/rs/artifact_manager)
  - [Artifact Manager Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/artifact_manager.rs)
- P2P
  - [P2P](https://github.com/dfinity/ic/tree/master/rs/p2p)
  - [P2P Interface](https://github.com/dfinity/ic/tree/master/rs/interfaces/p2p)
  - [P2P Protobuf Definition](https://github.com/dfinity/ic/tree/master/rs/protobuf/def/p2p)
  - [P2P Protobuf Generator](https://github.com/dfinity/ic/tree/master/rs/protobuf/src/gen/p2p)
  - [P2P Types](https://github.com/dfinity/ic/blob/master/rs/types/types/src/p2p.rs)
  - [Chunkable Types](https://github.com/dfinity/ic/blob/master/rs/types/types/src/chunkable.rs)
- Transport
  - [Transport](https://github.com/dfinity/ic/tree/master/rs/transport)
  - [Transport Test Client](https://github.com/dfinity/ic/tree/master/rs/transport_test_client)
- Tests
  - [Networking Tests](https://github.com/dfinity/ic/tree/master/rs/tests/networking)
  - [More Networking Tests](https://github.com/dfinity/ic/tree/master/rs/tests/src/networking)
- Monitoring
  - [Adapter Metrics](https://github.com/dfinity/ic/tree/master/rs/monitoring/adapter_metrics)
  - [Adapter Metrics Server](https://github.com/dfinity/ic/tree/master/rs/monitoring/adapter_metrics_server)
  - [Adapter Metrics Service](https://github.com/dfinity/ic/tree/master/rs/monitoring/adapter_metrics_service)
  - [On Chain Observability](https://github.com/dfinity/ic/tree/master/rs/monitoring/onchain_observability)
- Bitcoin
  - [Bitcoin Adapter](https://github.com/dfinity/ic/tree/master/rs/bitcoin/adapter)
  - [Bitcoin Adapter Client Interface](https://github.com/dfinity/ic/tree/master/rs/interfaces/bitcoin_adapter_client)
  - [Bitcoin Client](https://github.com/dfinity/ic/tree/master/rs/bitcoin/client)
  - [Bitcoin Service](https://github.com/dfinity/ic/tree/master/rs/bitcoin/service)
- Testnet
  - [Subnet update workload script](https://github.com/dfinity/ic/blob/master/testnet/tests/scripts/subnet_update_workload.sh)
- Miscellaneous
  - [Replica](https://github.com/dfinity/ic/tree/master/rs/replica)
  - [Artifact Pool Interface](https://github.com/dfinity/ic/blob/master/rs/interfaces/src/artifact_pool.rs)
  - [Async Utils](https://github.com/dfinity/ic/tree/master/rs/async_utils)
  - [Canister Client](https://github.com/dfinity/ic/tree/master/rs/canister_client)
  - [Transport Interface](https://github.com/dfinity/ic/tree/master/rs/interfaces/transport)
  - [Registry (NNS) Firewall Helper](https://github.com/dfinity/ic/blob/master/rs/registry/helpers/src/firewall.rs)
  - [HTTP Endpoints](https://github.com/dfinity/ic/tree/master/rs/http_endpoints)
  - [Proxy Canister](https://github.com/dfinity/ic/tree/master/rs/rust_canisters/proxy_canister)
  - [Starter (Minimal replica for SDK)](https://github.com/dfinity/ic/tree/master/rs/starter)
