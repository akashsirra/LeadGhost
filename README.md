# AEGIS

**Autonomous Engineering & Intelligence System**

AEGIS is a verification-first engineering agent: bounded tools execute work, explicit permissions control authority, and evidence—not model claims—determines what can be trusted.

## Current product — v1.1 preview

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
- **Model-driven read-only agent mode** using the OpenAI Responses API and function calling when `OPENAI_API_KEY` is configured.
- Deterministic planner fallback when no model key is configured.

## Model-driven agent mode

Set these server-side variables:

- `OPENAI_API_KEY` — required to enable model-driven planning. Never expose it to the browser or commit it.
- `AEGIS_MODEL` — optional model ID; defaults to `gpt-6-astra`.

The model can select only AEGIS-registered read-only tools. AEGIS executes those tools, records their evidence, and returns the observations to the model. The model can summarize what it found, but **its summary cannot produce PASS**. Model mode intentionally returns `UNKNOWN` until an objective verifier establishes success.

This is the core trust boundary:

`Model proposes → AEGIS permits → Tool executes → Evidence recorded → Objective verifier decides`

Without `OPENAI_API_KEY`, the app continues to work with the deterministic planner so local development does not depend on an external service.

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
- **Orchestrator / runtime** — deterministic fallback execution and the stable execution boundary.
- **Model agent** — optional reasoning loop that selects registered tools but has no direct filesystem or Git authority.
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
5. **v1.1 preview** — model-driven read-only agent loop with evidence-first semantics.
6. **Next** — objective task-specific verifiers, browser verification, reusable skills/evals, sandboxed execution, and progressively autonomous release workflows.

The roadmap is cumulative: every higher-trust capability must preserve the verification and permission boundaries below it.

## Non-negotiable rules

- Never treat model output as evidence of success.
- Never fabricate tests, metrics, files, or tool output.
- Unknown is not pass.
- Verification should be reproducible.
- Least privilege by default.
- Writes require explicit approval until stronger trust guarantees exist.
- Secrets are never exposed through tools or evidence.
- Remote writes never target the default branch directly.
- Recurring human review comments should become automated checks when possible.
