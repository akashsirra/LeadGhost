# AEGIS

**Autonomous Engineering & Intelligence System**

AEGIS is a verification-first agent-engineering system: agents propose work, bounded tools execute it, and deterministic verification decides what can be trusted.

## Working now — v0.2

The local runtime is live at `/app` and follows:

`Goal → Plan → Tool → Observe → Verify → Evidence → Result`

It currently includes a deterministic planner and three least-privilege tools:

- `echo` — read-only text preservation.
- `calculate` — basic arithmetic with a small parser and no dynamic code execution.
- `timestamp` — runtime clock observation.

Every tool execution produces provenance-bearing evidence. Every verification check must also produce evidence. Missing evidence yields **UNKNOWN**, never **PASS**.

The planner is deliberately deterministic at this stage. A future model can be connected behind the `Planner` interface without giving the model authority over the trust boundary.

## Architecture

- **Orchestrator / runtime** — turns a bounded task into a plan and executes only registered tools.
- **Planner** — currently deterministic; later accepts a model behind a stable interface.
- **Tools** — explicit, least-privilege capabilities.
- **Verifier** — checks observable outputs and owns PASS/FAIL/UNKNOWN.
- **Evidence ledger** — records tool and verification provenance.
- **Evaluator** — regression tests runtime behavior.
- **Policies** — hard boundaries for future filesystem, Git, browser, and cloud tools.

## Trust boundary

**Model proposes → runtime permits → tools observe → verifier decides.**

No model response can directly turn an unverified run into a success.

## Trust ladder

1. One local agent.
2. Deterministic verification.
3. Reusable skills.
4. Agent evaluations.
5. Hard constraints and CI gates.
6. Specialized agent team.
7. Cloud execution.
8. Autonomous PR/release workflows.

We are currently at step 2 and building upward only when the previous step is measurable.

## Engineering rules

- Never treat model output as evidence.
- Never fabricate test results, metrics, files, or tool output.
- Unknown is not pass.
- Verification should be reproducible.
- Agents receive least-privilege tools.
- Destructive/external side effects require a future approval layer.
- Recurring human review comments should become automated checks when possible.
