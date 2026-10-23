# Experimental security model

- No funds, token balances, escrow, external state-changing calls, upgrades, owner roles or arbitrary code execution.
- Public analysis is permissionless. A native actor owns only its request nonce and sixteen-analysis quota. It cannot overwrite an analysis, regardless of actor identity. Quotas are not Sybil protection.
- Context roots bind exact source coordinate/hash, event names, policy and native contract address. Native transaction identity binds request nonce; no self-reported agent identifier or signature recovery scheme.
- URL constructor restricts HTTPS raw GitHub full-commit text sources and forbids branch names/path traversal/query strings. Bodies are bounded, decoded strictly and never truncated. Redirect/provider guarantees remain platform trust assumptions.
- Hashes bind actual fetched bytes; source SHA length alone never grants a result. Model output is bounded, duplicate keys reject, pair coverage is complete, unknown labels and invented fields reject.
- Validator callbacks independently fetch/interpret and exactly compare all report fields. Matching format alone is insufficient. Provider/model disagreement is not converted into an approved result.
- Post-consensus context/evidence checks precede storage. Malformed model reports fail, not UNKNOWN. Honest ambiguity keeps every allowed world. Contradictions yield no claims; there is no vacuous-truth authorization.
- Exact finite integer ranks, no floats, no model-generated executable code. Proper interval assumptions are explicit.
- Writes commit no partial mutation before nondeterministic completion. Terminal outcomes immutable; no funds can become locked. Availability cost: a HELD result is not retried at the same input root.
- Query root equality prevents substituting a different interpretation. Reverse queries use inverse relations; witnesses remain in original event endpoint order.
- Signing is restricted to dedicated gasless StudioNet tests using the CLI's native encrypted keystore; private keys/passwords never exported or committed. Proof runner persists uncertain broadcasts and refuses automatic resend.
- Full receipts, onchain source, roots and states must be independently checked before proof publication. FINALIZED plus execution ERROR is labeled as a rejected attempt, not business success. Local callback tests are not distributed validator proofs.
- No audited-production, global-novelty, factual-observation, independently authored sources or reviewer-acceptance claim.
