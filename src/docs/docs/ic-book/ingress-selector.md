---
title: Ingress Selector
description: The Ingress Selector is responsible for filling the payload of a block.
---

## Summary
The Ingress Selector is a component used by Consensus to build and validate a payload. This payload is then inserted in a block and proposed to other replicas.
The payload is constructed by following a quota-based strategy which guarantees that the payload is shared "fairly" among the canisters.

## Implementation
[IngressSelector](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/interfaces/src/ingress_manager.rs#L107C1-L169C2) is implemented by [IngressManager](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/lib.rs#L114C1-L139C2).

The [get_ingress_payload](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L34) method creates the ingress payload which is then inserted into a block. This method gets all the validated artifacts within a specified expiry range and pushes each of them in the corresponding canister queue. The messages are sorted by expiry time to prevent massages from malicious users to front-run the others.

Once the canister queues are built, an [initial quota](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L128C9-L131C11) is computed by dividing the maximum number of bytes in a payload by the number of canister queues. This way, initially the same amount of payload is allocated for each canister.

The payload is then filled up by iterating over the canister queues with a round-robin schedule (in a circular and sequential manner). Each canister queue gets to insert its ingress messages in the payload until either:

1. the payload byte [limit](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L173C21-L176C22) is reached
2. both [conditions](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L178C21-L182C22) hold:
    1. canister quota is reached
    2. at least one message from the canister queue has been included

Once condition 1 is met, the payload is full and so it’s serialized and returned to the caller.

Once condition 2 is met, instead, the canister shall not include more messages in the payload for now and therefore the next canister queue (according to the round-robin schedule) should be processed. However, once the round-robin is completed, if there is still some space in the payload (because some canister queues did not fill their quotas), the canister queues that still have some ingress messages can continue filling up the payload. Before doing so, a [new quota](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L208C17-L214C19) is computed by dividing the remaining bytes in the payload by the number of canisters with a yet non-empty queue. This continues until the payload is full or all canister queues are empty. Once this happens, the payload is serialized and returned to the caller.

Due to condition 2.b, at least one message per canister queue is [always included](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L187C21-L190C63). This way, each canister can make guaranteed progress. However, one single message may significantly exceed the canister quota, thus the total bytes included in the payload are [tracked for each canister](https://github.com/dfinity/ic/blob/f3ffe989bcb034a199308e8d0a5a6659348862b2/rs/ingress_manager/src/ingress_selector.rs#L186C27-L186C41). Thus, a canister that exceeds its quota significantly with a single message will have less (sometimes no) additional space in later round-robin iterations, this "raises the cumulative bar".