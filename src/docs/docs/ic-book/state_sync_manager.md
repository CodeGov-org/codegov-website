---
title: State Sync Manager
description: The State Sync Manager synchronizes the local state of a replica to the state of the subnet.
---

## Summary

The State Sync Manager implements the state sync protocol which enables a replica that has fallen behind to synchronize to the replicated state of the subnet without having to (re-)execute all the blocks. Instead, the replica can immediately download the required state from other peers, and verify its authenticity.

## Implementation

In order to get an overview of the new QUIC-based P2P used for state sync, make sure to read [this](https://medium.com/dfinity/new-p2p-layer-of-the-internet-computer-introduces-quic-for-state-sync-984764fe9976) post.

The [StateSyncManager](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L108C1-L117C2) is responsible for implementing the state sync logic. In particular, it:

1. periodically broadcasts an advert of the latest state to all peers
2. handles adverts from peers against the local state and:
   - starts state sync if necessary
   - adds peers to ongoing state sync if they advertise the same state

When the StateSyncManager [runs](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L123C9-L145C10), it keeps waiting for either 1 or 2 to happen.

### Periodic State Advert Broadcast

A state advert is broadcast [only](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L129C17-L129C66) if there is no previous [advertise_task](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L131C25-L136C27) still running. This ensures the [first guarantee](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L15C10-L15C51) promised by `StateSyncManager`: there is only ever one active state sync.

When an state advert has to be [broadcasted](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L224C9-L238C10), the `StateSyncManager` retrieves a [list](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/state_manager/src/state_sync.rs#L220C5-L225C6) of all the available local states from the `StateSyncClient` of the `StateManager`. The list [consists](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/state_manager/src/state_sync.rs#L113C5-L154C6) of `StateSyncArtifactId` corresponding to all recent and certified checkpoints. For each of these, and advert is [constructed](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/routes/advert.rs#L53), and [sent](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L230C17-L236C20) to each of the peers in a separate task using the [push](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/quic_transport/src/lib.rs#L165C5-L168C6) API of the [QUIC](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/quic_transport/src/lib.rs#L67C1-L71C2) transport.

### Handle Advert from Peer

When an advert of type `StateSyncArtifactId` is received from a peer. The replica checks whether there is an [ongoing state sync](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L152C9-L163C10) for the same `artifact_id`. If that’s the case, the replica [adds](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/ongoing.rs#L135C17-L142C18) the peer to the ongoing state sync so that the peer can be considered to [download](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L140C1-L141C1) chunks.

If there is no ongoing state sync, a new state sync is [started](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L165C9-L170C82) for the specified `artifact_id` by [creating](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/state_manager/src/state_sync.rs#L32C4-L54C6) a `Chunkable` artifact for the corresponding state. The `Chankable` artifact is then passed to [start_ongoing_state_sync](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L180C13-L189C15) which spawns a new task that [runs](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L123C5-L199C5) the ongoing state sync. The peer that sent the advert is then [added](https://github.com/dfinity/ic/blob/2bbf07fb054d66d896b1315fcfac8a97d8d7d7b6/rs/p2p/state_sync_manager/src/lib.rs#L190C13-L195C56) to the ongoing state sync. This [triggers](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L135C17-L142C18) the [spawn_chunk_downloads](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L237C5-L302C6) method of `OngoingStateSync` which [spawns](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L268C21-L282C23) a new task for each chunk that has to be [downloaded](https://github.com/dfinity/ic/blob/58e5a889ef576e27217e35849eb82a3bc172d7ff/rs/p2p/state_sync_manager/src/ongoing.rs#L304C5-L365C6).
