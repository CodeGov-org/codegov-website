---
title: Node Overview
description: Prepare for reviewing node Internet Computer Protocol replica upgrades
---

## Scope

- Node lifecycle
- Configuration management
- IC OS (Guest)
- HostOS (Host)
- Testnet Deployment

## Summary

- IC-OS is an all-encompassing term for all Internet Computer operating system images including HostOS, GuestOS, SetupOS, and Boundary-GuestOS
- Boundary-GuestOS is not relevant for replica upgrade reviews.
- SetupOS is an image containing both the HostOS and GuestOS
    - Deploys and bootstraps HostOS
- HostOS is the operating system that runs on the host machine
  - Main responsibility is to launch and run the GuestOS in a virtual machine
  - Creates a contained running environment across different hardware for the GuestOS
  - Acts as a convenience wrapper for Node Providers
  - Enables a secure enclave for guestOS (via SEV-SNP)
- GuestOS runs inside a virtual machine on the hostOS.
  - Runs the core IC protocol is run (the replica and orchestrator)
  - Protected in a secure enclave such that if an attacker gained access, they could not view or modify the data
  - Secure enclave is only possible in a virtual machine
  - Secure enclave is a work in progress

## Resources

- IC OS
  - [IC OS Readme](https://github.com/dfinity/ic/tree/master/ic-os#readme)
  - [SetupOS Readme](https://github.com/dfinity/ic/tree/master/ic-os/setupos)
  - [HostOS Readme](https://github.com/dfinity/ic/tree/master/ic-os/hostos)
  - [GuestOS Readme](https://github.com/dfinity/ic/tree/master/ic-os/guestos)
- [Node Provider Onboarding](https://wiki.internetcomputer.org/wiki/Node_Provider_Onboarding)

## Codebase

- [IC OS Disk Images](https://github.com/dfinity/ic/tree/master/ic-os) (except `boundary-os` and `boundary-api-os`)
- [GuestOS Vsock Agent](https://github.com/dfinity/ic/tree/master/rs/guestos_vsock_agent)
- [IC OS Rust Crates](https://github.com/dfinity/ic/tree/master/rs/ic_os)
- [Registry (NNS) Node Helper](https://github.com/dfinity/ic/blob/master/rs/registry/helpers/src/node.rs)
