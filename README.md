# AEGIS

**Autonomous Engineering & Intelligence System**

AEGIS is a verification-first engineering agent: bounded tools execute work, explicit permissions control authority, and deterministic verification decides what can be trusted.

## Current product — v1.0 preview

The `/app` Mission Control console covers the safe engineering loop:

`Mission → Inspect → Evidence → Propose → Approval → Apply → Typecheck → Test → Build → Verdict`

### Working capabilities

- Read-only workspace inspection and Git status/diff/history.
- Evidence ledger with provenance for tool observations and verification checks.
- PASS / FAIL / UNKNOWN semantics; missing evidence cannot become PASS.
- Explicit permission policy for workspace reads, tests, and future writes/releases.
- Controlled local file-change proposals with bounded size, sensitive-file blocking, stale-file protection, and an approval gate.
- Post-change verification through allowlisted `typecheck`, `test`, and `build` commands.
- Optional GitHub repository inspection for public repositories.
- Optional approved GitHub writes that always create a new `aegis/*` branch instead of writing directly to the default branch.
- Deterministic planner today; a model can be connected behind the planner boundary later.

## GitHub integration

Set these server-side environment variables when deploying with remote repository access:

- `GITHUB_TOKEN` — a token with the minimum repository permissions needed for the selected workflow.
- `AEGIS_GITHUB_REPO` — optional default repository in `owner/name` form.

The token is never sent to the browser or written into evidence. Remote writes require explicit approval, check the current file SHA to prevent stale edits, create a branch, and commit only the requested file change. Pull-request creation and CI feedback are intentionally separate trust steps.

## Trust boundary

**Model proposes → runtime permits → tools execute → verifier decides.**

A model never gets direct authority to declare success. Destructive or external side effects require explicit approval.

## Architecture

- **Mission Control** — human-facing console for goals, traces, evidence, proposals, and approvals.
- **Orchestrator / runtime** — turns bounded tasks into plans and executes registered tools.
- **Planner** — deterministic today; model-compatible interface for future agent reasoning.
- **Tools** — explicit least-privilege capabilities for workspace and Git inspection.
- **Policy** — permission decisions and approval requirements.
- **Engineering change layer** — creates and applies bounded patches only after approval.
- **GitHub adapter** — optional remote repository reads and branch-scoped approved writes.
- **Verifier** — owns PASS / FAIL / UNKNOWN.
- **Checks** — allowlisted reproducible test/typecheck/build commands.
- **Evidence ledger** — records provenance for observations and decisions.
- **CI** — typecheck, tests, and production build on every push/PR.

## Product roadmap

1. **v0.2** — deterministic runtime + evidence.
2. **v0.3** — controlled engineering changes + approval.
3. **v0.4** — automated regression verification.
4. **v0.5** — model-backed planning behind a strict tool boundary.
5. **v1.0** — Mission Control product surface and repository workflows.
6. **Future** — GitHub PR review, browser verification, reusable skills/evals, sandboxed cloud execution, and progressively autonomous release workflows.

The roadmap is cumulative: every higher-trust capability must preserve the verification and permission boundaries below it.

## Non-negotiable rules

- Never treat model output as evidence.
- Never fabricate tests, metrics, files, or tool output.
- Unknown is not pass.
- Verification should be reproducible.
- Least privilege by default.
- Writes require explicit approval until stronger trust guarantees exist.
- Secrets are never exposed through tools or evidence.
- Remote writes never target the default branch directly.
- Recurring human review comments should become automated checks when possible.
