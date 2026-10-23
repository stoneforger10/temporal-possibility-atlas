# Live proof ledger

Network: gasless StudioNet, chain 61999. Experimental deployment; no value transfer.

[Contract](https://explorer-studio.genlayer.com/address/0x941C78C7aFA3a067C76CAfc72ECA192510d3C44A) · [source](https://github.com/stoneforger10/temporal-possibility-atlas/blob/main/contracts/TemporalPossibilityAtlas.py) · [machine-readable ledger](PROOFS.json)

Source normalized SHA-256: `4d7f6a5a87dc890b266f64ff9db5c8e92816bd34c2bd05a10bb41481ea7ad38c`. Fixture commit: `38547d7d41baa5fb0625bbbfd612068fb323861f`.

## Transaction proof matrix

| Case | Final execution | Consensus | Transaction |
| --- | --- | --- | --- |
| deploy | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0x475b4368954e67ebea076b1dc16d4d5d97bee72acf61a4cb795ed0d525967c45) |
| analyze-ordered | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0xf4977283a0e54e687334fc688f8edf1c2132c9ed2aa0c540134115e0a7753b40) |
| analyze-ambiguous | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0x304738dcf407767b13fc4bb8bd70be3238822ebb5d5bcf765d0c21cde14579d0) |
| analyze-contradictory | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0xfdc0870e48e936b3c8a16b81d2b671a611666786d7f2e074d537c488b8ba7309) |
| analyze-unknown | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0xd8e41890017f12deea41506789fb93fed7eeb1d87e2785e8a6a654fd0dcb3ba1) |
| analyze-ordered-bad | SUCCESS | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0xaa8d602afaa5405c53120d44cbbd13a03187baaeb743788adc6d0a8ac7c12d5d) |
| input-resampling | ERROR — expected Input already analyzed | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0x17c7abaaa456058c76e9dbfb2c037ff84231d0ee8896b23fff347d2270fc3708) |
| nonce-replay | ERROR — expected Nonce already used | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0xe3a0ab4e1b08c17be9277a7280ea5679e62a8f144b374d64d886cd304693249a) |
| invalid-event-order | ERROR — expected Invalid analysis request | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0x26f152d85c4f2ae59bb67e480f3c7dc7ebaeec8932376e75b142dff7770a9e2b) |
| unsafe-url | ERROR — expected Invalid analysis request | MAJORITY_AGREE | [receipt](https://explorer-studio.genlayer.com/tx/0x66cc4f31ccbb1fbd8734bf7976f52e6cfd7f804e353557a76f952e751c731f0f) |

Voting metadata is included per receipt in PROOFS.json: leader-only execution is false, initial validators are at least three, and at least two explicit agree votes are required. Idle votes are preserved in the counts. MAJORITY_AGREE is not described as unanimity.

Six transactions executed successfully (deployment plus five immutable analyses). Four executed with expected ERROR; they are rejection evidence, not successful business operations. All ten finalized with MAJORITY_AGREE.

## Independently checked state

| Analysis | Status | Surviving orders | Record root |
| --- | --- | --- | --- |
| ordered | DETERMINED | 1 | `07a896482a0a7e37d77f791c17828b41373572060b67767760790b3f6a161b60` |
| ambiguous | AMBIGUOUS | 3 | `b2c2f21cbd64959955639319bcd6949297c04eef4aa34c2b7e2bf13d32c0d5b6` |
| contradictory | INCONSISTENT | 0 | `5b53cfd252428d5b1196a015a1087f68344c62447fb78677aacd6289668e7d17` |
| unknown | AMBIGUOUS | 13 | `6d4322158504c7d83ef3f0e734a72fc1a57435751849ebe11627c6e4368861cf` |
| ordered-bad | HELD | 0 | `42911f4b448917bebb080692fa68dee47455560bfa8b44224fd4c0d8c652e229` |

## Read-only query checks

These are state readbacks, not additional transactions.

| Analysis key | Pair and relation | Result |
| --- | --- | --- |
| `cd781d859154…` | ALPHA / GAMMA — BEFORE | NECESSARY |
| `cd781d859154…` | GAMMA / ALPHA — AFTER | NECESSARY |
| `cd781d859154…` | BETA / GAMMA — MEETS | NECESSARY |
| `cd781d859154…` | ALPHA / GAMMA — OVERLAPS | IMPOSSIBLE |
| `c85a409602af…` | ALPHA / BETA — OVERLAPS | POSSIBLE |
| `c85a409602af…` | ALPHA / BETA — EQUALS | IMPOSSIBLE |
| `da1dffbd619f…` | ALPHA / BETA — BEFORE | NO_CLAIM |
| `bc935b66ff17…` | ALPHA / BETA — BEFORE | POSSIBLE |
| `9e247210f3da…` | ALPHA / BETA — BEFORE | NO_CLAIM |

## Verification scope

`verify-live.mjs` independently checks finalized receipts and execution, deployed/local source equality, source bytes/hash/context, immutable roots, all five envelopes against a separate Cartesian endpoint oracle, all nine saved queries and rejected-request absence. All writes use one dedicated native test signer; signer identity is not evidence of validator independence. Live distributed disagreement was not induced. The callback test demonstrates rejection of a well-shaped wrong semantic answer locally.

42 Python direct/helper/callback tests, 3 JavaScript oracle tests and 5 SDK roundtrips passed. Exhaustive local cases include 2,197 atomic three-interval networks and 8,192 two-interval subsets. Lint and SDK validation passed.

Fictional source specifications establish conditional document constraints only; neither fetching nor hashing verifies actual event occurrence. Exact semantic consensus can still be wrong. No global-novelty, audited-production or reviewer-acceptance guarantee.

## Transport incident

One CLI attempt returned no captured hash. The incident remains in PROOFS.json; it is not a receipt proof. Before resumption, repeated unchanged latest/pending signer nonces, request absence, source equality and an exact match to the known contract history were independently checked. The final contract history matches all ten journaled hashes, with no additional observed transaction from the interrupted attempt. No private key was exported.
