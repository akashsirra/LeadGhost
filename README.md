# AEGIS

**Autonomous Engineering & Intelligence System**

AEGIS is an agent-engineering platform inspired by Lauren Tan's approach to trustworthy autonomous development: specialized agents, reusable skills, machine-verifiable evidence, evaluations, and hard constraints.

## North-star

Give AEGIS an engineering goal and progressively reduce the amount of human supervision required to safely complete it.

## Core loop

`Goal → Plan → Execute → Observe → Verify → Evidence → Review → Ship`

A model's claim is never proof of success. Verification must produce evidence.

## Architecture

- **Orchestrator** — decomposes goals and coordinates agents.
- **Agent runtime** — executes bounded tasks with explicit permissions.
- **Skills** — reusable procedures and domain knowledge.
- **Tools** — shell, filesystem, Git, browser/runtime tools, and later project-specific tools.
- **Verifier** — checks claims against observable evidence.
- **Evaluator** — regression tests agent behavior and skills.
- **Evidence ledger** — records actions, observations, tests, and decisions.
- **Feature map** — machine-readable map of capabilities and project navigation.
- **Policies** — hard boundaries for tools, files, commands, and approval levels.

## Trust ladder

1. One local agent.
2. Deterministic verification.
3. Reusable skills.
4. Agent evaluations.
5. Hard constraints and CI gates.
6. Specialized agent team.
7. Cloud execution.
8. Autonomous PR/release workflows.

## First milestone: trustworthy single-agent loop

AEGIS v0.1 is successful only when it can:

1. Accept a bounded engineering task.
2. Produce a plan.
3. Execute permitted actions.
4. record observations and evidence.
5. Run deterministic verification.
6. Distinguish **PASS**, **FAIL**, and **UNKNOWN**.
7. Refuse to claim success without sufficient evidence.
8. Persist the run so another agent or human can audit it.

## Non-negotiable engineering rules

- Never treat model output as evidence.
- Never fabricate test results, metrics, files, or tool output.
- Unknown is not pass.
- Verification must be reproducible where practical.
- Agents get least-privilege tools.
- Recurring human review comments should become automated checks when possible.
- Every important capability gets an evaluation before it is trusted.

## Repository note

This repository was previously used for LeadGhost. It is now being rebuilt as AEGIS; the existing code is legacy and will be replaced incrementally behind verified milestones.
