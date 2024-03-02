---
title: Bitcoin Integration
description: Bitcoin Integration is inter-chain communication the Internet Computer and the Bitcoin network.
---

## Summary

Bitcoin Integration enables canister smart contracts to send and receive transactions to the Bitcoin network. It is an inter-chain communication without any need intermediaries as ICP replicas directly transmit transactions and pull blocks from Bitcoin.

## Implementation

The `ConnectionManager` is responsible for maintaining the connections with the Bitcoin nodes and to [send](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/connectionmanager.rs#L578C5-L590C6) `NetworkMessage`s to them. The `ConnectionManager` sends the messages via a channel which is [received](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/stream.rs#L286C9-L288C10) by the `Stream` and sent via [TCP stream](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/stream.rs#L273C9-L276C40) to a node. It only [processes](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/connectionmanager.rs#L652C5-L670C6) messages received from the Bitcoin network that are related to client connection management.

The incoming blocks from the Bitcoin network are instead received via a [TCP stream](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/stream.rs#L290C9-L290C48) and [relayed](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/stream.rs#L291C9-L294C20) via the [router](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/router.rs#L75C17-L92C19) to be [processed](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/blockchainmanager.rs#L623C5-L659C6) by the `BlockchainManager`. When a block is received, it is [added](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/blockchainstate.rs#L228C5-L249C6) to the `BlockchainState`, which is a cache of the Bitcoing blockchain.

The BTC adapter gRPC service `BtcServiceServer` (including `BtcServiceImpl`) is the component of the adapter which the replica interacts with, either for [sending a transaction](https://github.com/dfinity/ic/blob/master/rs/bitcoin/client/src/lib.rs#L76C21-L85C54) to the Bitcoin network, or for [retrieving blocks](https://github.com/dfinity/ic/blob/master/rs/bitcoin/client/src/lib.rs#L103C21-L115C54).

The `BtcServiceImpl` implements two methods:

- [get_successor](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/rpc_server.rs#L77C5-L100C6), which via the `GetSuccessorHandler` [retrieves](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/get_successors_handler.rs#L100C9-L129C11) the next block from the `BlockchainState` and [relays](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/get_successors_handler.rs#L136C13-L140C23) it [via the router](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/router.rs#L93C17-L103C18) to the `BlockchainManager` so that it can [enqueue](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/blockchainmanager.rs#L697C5-L710C6) new blocks to download
- [send_transaction](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/rpc_server.rs#L102C5-L120C6), which [via the router](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/router.rs#L104C17-L108C19) informs the `TransactionManager` to [enqueue](https://github.com/dfinity/ic/blob/master/rs/bitcoin/adapter/src/transaction_store.rs#L80C5-L103C6) the transaction in the `TransactionStore`

The `BitcoinAdapterClientImpl` interacts with the gRPC service via the [send_blocking](https://github.com/dfinity/ic/blob/master/rs/bitcoin/client/src/lib.rs#L54C5-L128C6) method. This client is part of the `BitcoinPayloadBuilder` (referred to as `self_validating_payload_builder`), which is [included](https://github.com/dfinity/ic/blob/master/rs/consensus/src/consensus/payload_builder.rs#L56C13-L56C89) in the `PayloadBuilderImpl`, used by the `BlockMaker` to [construct](https://github.com/dfinity/ic/blob/master/rs/consensus/src/consensus/payload_builder.rs#L127C9-L146C10) the payload.
When the payload builder is triggered, the [build_payload](https://github.com/dfinity/ic/blob/master/rs/bitcoin/consensus/src/payload_builder.rs#L336C5-L359C6) method of the `BitcoinPayloadBuilder` is called to [retrieve the requests](https://github.com/dfinity/ic/blob/master/rs/bitcoin/consensus/src/payload_builder.rs#L313C5-L332C10) to be made to the [client adapter](https://github.com/dfinity/ic/blob/master/rs/bitcoin/consensus/src/payload_builder.rs#L146C13-L158C15).
