## Summary

The [Purger](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L36C1-L47C2) examines the state of the consensus pool to determine which artifacts can be purged, and instructs the state manager about the old replicated states that are no longer needed.

## Implementation

The Purger is called according to a [round-robin schedule](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus.rs#L518C9-L530C57) together with the other consensus sub-components.

Once the scheduler calls the [on_state_change](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L76C12-L76C27) method of the Purger:

1. the artifacts that are in either of the following categories can be purged:
    1. [unvalidated artifacts below the next expected batch height](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L155)
    2. [validated artifacts below the latest CatchUpPackage height](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L212) (even though a minimum chain length that is older than the CatchUpPackage is kept in order to help peers catch up)
    3. [validated Finalization and Notarization shares below the latest finalized
    height](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L245)
2. the replicated states in either of the following categories can be purged:
    1. [replicated states below the certified height recorded in the block in the latest CatchUpPackage](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L267)
    2. [replicated states below the catch up height](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/consensus/src/consensus/purger.rs#L296)

The purging mechanism is different depending whether it is the consensus pool or the replicated state being purged.

In scenario 1, for each artifact that needs to be eliminated, a [ChangeAction](https://github.com/dfinity/ic/blob/3e1345c77c82339779b6fde470acf0f474b76988/rs/interfaces/src/consensus_pool.rs#L40C1-L51C2) is inserted into a [ChangeSet](https://github.com/dfinity/ic/blob/3e1345c77c82339779b6fde470acf0f474b76988/rs/artifact_pool/src/consensus_pool.rs#L589). The ChangeSet is returned to the [process_changes](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/artifact_manager/src/processors.rs#L45C5-L70C6) method of the Artifact Manager’s [Processor](https://github.com/dfinity/ic/blob/3ffc532770cbb9b72930024e3bf6ab7dadb956ce/rs/artifact_manager/src/processors.rs#L14C1-L22C2). This takes care of mutating the consensus pool according to the changes prescribed.

In scenario 2, instead, the replicated states that can be purged are handled directly by the State Manager by calling the [remove_state_below](https://github.com/dfinity/ic/blob/3e1345c77c82339779b6fde470acf0f474b76988/rs/state_manager/src/lib.rs#L2962C5-L2962C5) method in case 2.b (or it’s variant [remove_inmemory_states_below](https://github.com/dfinity/ic/blob/3e1345c77c82339779b6fde470acf0f474b76988/rs/state_manager/src/lib.rs#L3013C22-L3013C22) in case 2.a)