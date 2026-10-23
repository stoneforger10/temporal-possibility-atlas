# TemporalPossibilityAtlas

Experimental GenLayer interval-possibility primitive. Fetch a bounded, commit-pinned document; independently interpret temporal restrictions; exhaustively compute all admissible relative endpoint orders. Query **NECESSARY / POSSIBLE / IMPOSSIBLE** without inventing a single timeline. Failed acquisition or inconsistent constraints returns **NO_CLAIM**, never vacuous certainty.

This is authored-document satisfiability, **not an oracle for whether events happened**. Source hashes bind bytes; they do not prove truth. The fictional fixtures are scheduling specifications, not operational evidence. No funds, service-delivery certification, graphs with mutable heads, version proposals, owner-controlled transitions or one-time certificates.

## Mechanism

1. Anyone requests an analysis of two or three sorted, named proper intervals (start < end).
2. Inside the nondeterministic flow, the leader AND each validator fetch the complete HTTPS UTF-8 document and recompute SHA-256. Only full GitHub commit coordinates are accepted; bodies are bounded to 4,096 bytes. No caller-provided relation vector or narrative is accepted as an evaluated answer.
3. Every node independently interprets the document into all thirteen Allen interval relations for every event pair. Explicit partial information remains a disjunction; a missing pair permits all thirteen. Malformed output is an error, not a fabricated UNKNOWN answer.
4. Custom equivalence requires exact equality of context, acquisition status, complete body, hash and every normalized relation set. A valid-looking wrong label is rejected by independent re-interpretation, not merely schema checked. There is no confidence tolerance.
5. An exhaustive exact solver enumerates canonical weak endpoint orders: 13 for two proper intervals, 409 for three. It filters against every agreed constraint, records the remaining count, world-set digest, possible relations and a canonical witness for every possibility.
6. Immutable root-bound queries quantify over **all** surviving orders. A singleton relation is necessary; an admissible non-singleton is possible; an absent relation is impossible. No worlds means INCONSISTENT and no temporal claim. Source failure means HELD and no temporal claim.

Example: ALPHA before BETA and BETA meets GAMMA makes ALPHA-before-GAMMA necessary even when that pair is missing. ALPHA starts earlier and ends earlier than BETA permits BEFORE, MEETS **or** OVERLAPS. The contract preserves all three.

## Storage and public API

- `analyses[input_root]`: one immutable evidence report and complete possibility envelope.
- `requests[hash(contract, actor, nonce)]`: immutable request-to-analysis association.
- `counts[actor]`: at most sixteen successful analyses per principal (not Sybil resistance).
- `analyze(nonce, coordinate, sha256, events_csv)` is the only write. Content-addressed inputs cannot be resampled by changing actor or nonce. There are no owner/admin methods.
- `analysis_key(coordinate, sha256, events_csv)`, `get_analysis(key)`, `get_request(actor, nonce)` and `query(key, exact_record_root, left, right, relation)` are views.
- Event names: sorted unique uppercase identifiers, two or three, each at most sixteen characters. Nonces: 1–48 ASCII identifier characters.
- Coordinates: `OWNER/REPO/FULL_40_HEX_COMMIT/path.txt`. No branch names, arbitrary hosts, queries or traversal.
- Query witnesses list endpoint ranks in event order: `[A.start,A.end,B.start,B.end,...]`. Ranks encode relative order/equality, not clock time or duration.

## Distinctness

| Existing mechanism | Why this is not a domain rename |
| --- | --- |
| DynamicResearchCommons / DynamicLearningPath | No mutable graph, dependency ordering proposal, owner approval, sequence advancement or versioned head. |
| DimensionalTermKernel | No quantities, rational conversion, affine temperature points, typed arithmetic evaluator or calculation-record workflow. |
| SourceTariffVM / BoundedPolicyCompiler | No pricing meters, program opcodes, generated Boolean decision function or executable policy. |
| OrdinalEndowmentSwap | No participant endowment, consent lifecycle, allocation or ownership transfer. |
| SemanticFlowEnvelope | No capacitated flow, compatibility graph, allocation bounds or min-cut. |
| AffineInvariantForge | No synthesized induction invariant or arithmetic proof program. |

The substantive kernel here is existential/universal interval-model reasoning under semantic uncertainty. Allen interval algebra itself is established mathematics, not a new invention. Shared acquisition, signing and transport helpers are intentionally reused. These comparisons do not guarantee global novelty or reviewer acceptance.

## Validation and reproduction

Pinned runner is the first line of [the source](contracts/TemporalPossibilityAtlas.py). Lint and SDK validation must pass before tests. Use Python 3.12+ and the pinned [development dependencies](requirements-dev.txt), plus Node 24 and the exact package lock.

```powershell
genvm-lint check contracts/TemporalPossibilityAtlas.py --json
python -m pytest tests -q
npm ci --ignore-scripts
node --test tests/atlas.test.mjs
node scripts/sdk-check.mjs
```

42 Python direct/helper/callback tests and 3 independent JavaScript oracle tests. Includes all 2,197 atomic three-interval networks, all 8,192 two-interval relation subsets, the complete 409-order three-interval universe, inverse relations, replay, cross-actor resampling, root substitution, schema/evidence tampering, failed acquisition, malformed model and actual validator callback execution. Direct VM tests alone do not demonstrate distributed consensus. The Windows fixture narrowly defers only the known open-temporary-file WinError 32 cleanup; it never suppresses contract execution failures.

The JavaScript oracle enumerates a Cartesian space independently; it imports neither contract code nor the production ordered-partition algorithm. `scripts/verify-live.mjs` is read-only and checks receipts, deployed source, roots, all envelopes, queries and rejected-request absence. It cannot submit a transaction.

## Deployment workflow

Use only gasless `studionet` (chain 61999) and an unlocked dedicated encrypted CLI test account. No key export, mainnet funding or value transfer. Publish fixtures first, then pass their full commit to:

```powershell
$env:TPA_NATIVE_HTTP='1' # Windows fallback for this endpoint only
node --require ./scripts/native-http.cjs scripts/complete-proofs.mjs FULL_FIXTURE_COMMIT
node --require ./scripts/native-http.cjs scripts/verify-live.mjs
node scripts/render-proofs.mjs
```

The journal saves intent/nonce before broadcast and a known hash immediately. A known hash is checked, never blindly resent. Unknown broadcast outcomes stop for history inspection. Finalization alone is not success: each proof checks leader execution and validator agreement. Expected reverts remain labeled ERROR, not successful business operations. Signing uses the CLI's native encrypted account without exposing its key. Helpers set StudioNet/account process-locally, not by changing global configuration.

Publication status and finalized transaction evidence belong in `LIVE_PROOFS.md` once independently checked. Do not treat this workflow description as proof of a deployment.

## Limits

Model errors can still reach agreement; consensus is not mathematical proof of faithful prose interpretation. Exact equality favors safety over availability. Full-commit HTTPS availability, GitHub content and model providers remain dependencies. A source can lie: the result only follows conditionally from its interpreted constraints. Omitted assertions in prose can be missed by every model. Missing timing yields possibilities, not truth or probability. Coarse unknown sets conservatively widen the envelope. Multi-interval interpretations of one name, point events, duration arithmetic and absolute timestamps are unsupported.

All evidence outcomes, including HELD, are immutable for that exact request. A transient acquisition failure can permanently hold that input; there is deliberately no owner overwrite or hidden retry. Changing the source commit changes the input root. The sixteen-analysis cap limits one account, not global state growth. The hosted Studio network is an experimental environment, not production deployment assurance. No audit or acceptance guarantee.

See [architecture](docs/architecture.md) and [security](SECURITY.md). GenLayer nondeterministic calls and storage boundaries follow [the official documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).
