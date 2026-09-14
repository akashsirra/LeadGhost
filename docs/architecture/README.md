# AEGIS Architecture

## v0.1 contract

AEGIS is a verification-first agent runtime. The first release deliberately has one agent role and a deterministic verifier.

### Flow

`Task → Plan → Action → Observation → Verification → Evidence → Result`

### Result semantics

- **PASS**: every required check passed and sufficient evidence exists.
- **FAIL**: one or more required checks failed and evidence exists.
- **UNKNOWN**: the system cannot establish success with sufficient evidence.

UNKNOWN is a first-class state. It must never be silently converted to PASS.

## Components

| Component | Responsibility |
|---|---|
| Orchestrator | Turns a user goal into bounded work. |
| Runtime | Executes actions under permissions. |
| Skills | Reusable procedures and knowledge. |
| Tools | Controlled external capabilities. |
| Verifier | Tests observable outcomes. |
| Evaluator | Tests agent behavior and skills. |
| Evidence ledger | Stores provenance for important claims. |
| Feature map | Describes supported capabilities and navigation. |
| Policy | Defines hard boundaries and approval requirements. |

## Design principle

If a rule can be made mechanically enforceable, prefer enforcement over another natural-language instruction.
