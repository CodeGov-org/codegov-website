---
title: Ingress Selector
description: The Ingress Selector is responsible for filling the payload of a block.
---

## Summary

The Ingress Selector is a component used by Consensus to build and validate a payload. This payload is then inserted in a block and proposed to other replicas.
The payload is constructed by following a quota-based strategy which guarantees that the payload is shared "fairly" among the canisters.

## Implementation

[IngressSelector](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/interfaces/src/ingress_manager.rs#L107C1-L169C2) is implemented by [IngressManager](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/lib.rs#L114C1-L139C2).

The [get_ingress_payload](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L49C8-L49C27) method creates the ingress payload which is then inserted into a block. This method gets all the validated artifacts within a specified expiry range and pushes each of them in the corresponding canister queue. The messages are sorted by expiry time to prevent massages from malicious users to front-run the others.

Once the canister queues are built, an [initial quota](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L144C9-L147C11) is computed by dividing the maximum number of bytes in a payload by the number of canister queues. This way, initially the same amount of payload is allocated for each canister.

The payload is then filled up by iterating over the canister queues with a round-robin schedule (in a circular and sequential manner). Each canister queue gets to insert its ingress messages in the payload until either:

1. the payload byte [limit](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L194C21-L198C1) is reached
2. both [conditions](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L199C21-L211C22) hold:
   a. canister quota is reached
   b. at least [max(1,n)](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L204C28-L207C26) messages from the canister queue have been included, where `n` is the number of [round robin iterations](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L154C9-L154C43) minus a [fixed threshold](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L46)

Once condition 1 is met, the payload is full and so it’s serialized and returned to the caller.

Once condition 2 is met, instead, the canister shall not include more messages in the payload for now and therefore the next canister queue (according to the round-robin schedule) should be processed. However, once the round-robin is completed, if there is still some space in the payload (because some canister queues did not fill their quotas), the canister queues that still have some ingress messages can continue filling up the payload.

Before starting a new round-robin, the [quota is updated](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L237C17-L243C19) by dividing the remaining bytes in the payload by the number of canisters with a yet non-empty queue. This continues until the payload is full or all canister queues are empty. Once this happens, the payload is serialized and returned to the caller.

### Consideration 1

Due to condition 2.b, at least one message per canister queue is [always included](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L217C21-L221C1). This way, each canister can make guaranteed progress.

However, one single message may significantly exceed the canister quota, thus the total bytes included in the payload are [tracked for each canister](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L216C21-L216C58) and compared against a [cumulative quota](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L241C25-L241C98) so that a canister that exceededs its quota in a previous round would not be able to insert more messages until its total bytes to be included are less than the current cumulative quota. Thus, a canister that exceeds its quota significantly with a single message will have less (sometimes no) additional space in later round-robin iterations.

## Example

To clarify the previous point, consider the following example:

- payload byte limit: 100KB
- canister count: 5

The inital quota is 100KB / 5 = 20KB. Suppose that after the first round-robin, the payload is filled as follows:

|                | Canister 1 | Canister 2 | Canister 3 | Canister 4 | Canister 5 |
| -------------- | ---------- | ---------- | ---------- | ---------- | ---------- |
| bytes_included | 30KB       | 20KB       | 20KB       | 5KB        | 5KB        |

Canister 1 included a single large message of 30KB that crossed its quota, canisters
2 and 3 hit the limit exactly, while canisters 4 and 5 don't have enough messages to
fill the quota (and thus they are removed from future rounds).

So far, 80KB of messages have been included in the payload, so there are 20KB to spare that should be distributed among the remaining canisters (1, 2 and 3).

One possible implementation could distribute the 20KB equally between the remaining three canisters, meaning that each gets 6.6KB as a new quota. However, this would not be fair as it would give
canister 1 a chance to include 6.6KB more, even though it already crossed its
previous quota by 10KB! So this approach has a bias towards canisters that have
large messages that likely cross the quota.

Instead of computing a new quota each time based on the remaining bytes to be distributed, the actual implementation continues to compare against each
canister's total bytes_included ([this is why there is += instead of =](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L241C25-L241C98)). So
instead of the quota being 6.6KB, it is now 26.6KB.

Since canister 2 and 3 included exactly 20KB in earlier
rounds, they get a chance to include 6.6KB more (until they hit 26.6KB). Canister
1 however has already crossed the 26.6KB mark, so it will not be able to include anything, as the [total bytes included are compared to the cumulative quota](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L208C28-L208C73).
Therefore, canister 1 which crossed the quota in the first round gets punished during message selection of the second roound, making this implementation more fair.

### Consideration 2

Condition 2.b is [weakened](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L33C1-L45C11) once the number of [round robin iterations](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L154C9-L154C43) reaches a [threshold](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L46).

Initially, the quota is a hard limit with the only exception being the first canister's message. After the threshold is reached, this limit weakens as the quota is used to stop including messages for a canister only if the messages included is greather than the [difference between the current round robin iteration and the threshold](https://github.com/dfinity/ic/blob/67730a29e2c5272bcf7c3ad23e9ffa7309e1aede/rs/ingress_manager/src/ingress_selector.rs#L206C29-L206C99). This is needed to make sure that the payload builder does not get stuck.

## Example
