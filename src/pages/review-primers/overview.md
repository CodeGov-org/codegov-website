---
title: Overview
description: Prepare for reviewing Internet Computer Protocol replica upgrades
layout: ../../layout/BaseLayout.astro
---

## Review Primers

Review primers are onboarding documents that aim to arm CodeGov code reviewers with the required knowledge to effectively review Internet Computer Protocol replica upgrades. The primers are split along the same axis as the categories that Dfinity assigns to code commits, which also aligns with the internal Dfinity team structure.

## Review Categories

- [Node](/review-primers/node)
- [Networking](/review-primers/networking)
- [Consensus](/review-primers/consensus)
- [Message Routing](/review-primers/message-routing)
- [Execution](/review-primers/execution)
- [Runtime](/review-primers/runtime)
- [Crypto](/review-primers/crypto)
- [Financial Integrations](/review-primers/financial-integrations)

## Resources

There are already many great resources that you can use to learn about the Internet Computer overall before diving deeper into one of the lower-level layers.

- [Internetcomputer.org](https://internetcomputer.org/)
- [wiki.internetcomputer.org](https://wiki.internetcomputer.org/)
- [Internet Computer Whitepaper](https://internetcomputer.org/whitepaper.pdf)
- [Internet Computer Interface Spec](https://github.com/dfinity/interface-spec/blob/master/spec/index.adoc)
- [Dfinity YouTube channel](https://www.youtube.com/@DFINITY/featured)
- [Inside the Internet Computer - YouTube Playlist](https://www.youtube.com/playlist?list=PLuhDt1vhGcrfHG_rnRKsqZO1jL_Pd970h)
- [Git Codeowners](https://github.com/dfinity/ic/blob/master/.gitlab/CODEOWNERS): The Codeowners configuration assigns “ownership” of Dfinity teams to certain parts of the codebase. Since the team structure aligns with components of the stack and review categories, this is a useful resource for identifying which parts of the codebase are relevant for each category.

## Common Technologies

Several technologies are used throughout many layers of the Internet Computer Protocol so it will be useful to understand them well, regardless of what review category you are taking part in.

### Rust

[Rust](https://www.rust-lang.org/): Rust is the most widely used programming language in the IC’s codebase

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [The Easy Rust Book](https://dhghomon.github.io/easy_rust/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Mmapped: Designing error types in Rust](https://mmapped.blog/posts/12-rust-error-handling.html)

#### Tokio

[Tokio](https://tokio.rs/) is an [async](https://rust-lang.github.io/async-book/) implementation and runtime for Rust commonly used throughout the Internet Computer Protocol.

- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Tokio Blog](https://tokio.rs/blog)
- [Rhyl: Async - what is blocking?](https://ryhl.io/blog/async-what-is-blocking/)
- [Rhyl: Actors with Tokio](https://ryhl.io/blog/actors-with-tokio/)

#### Tarpc

[Tarpc](https://github.com/google/tarpc): RPC framework for Rust.

### Protobuf

[Protobuf](https://protobuf.dev/): Protobuf is a data interchange format commonly used throughout the IC

More useful resources for Protobuf:

- [Protobuf codebase](https://github.com/protocolbuffers/protobuf)
- [Wikipedia: Protocol Buffers](https://en.wikipedia.org/wiki/Protocol_Buffers)
