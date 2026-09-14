import { createEvidence } from './evidence'
import { getTool, type ToolResult } from './tools'
import { verify } from './verifier'
import type { Evidence, Task, VerificationResult } from './types'

export type PlannedAction = {
  id: string
  tool: string
  input: unknown
  reason: string
}

export type RunEvent =
  | { type: 'plan'; action: PlannedAction }
  | { type: 'execute'; actionId: string; tool: string; output: unknown }
  | { type: 'verify'; result: VerificationResult }

export interface AgentPlan {
  actions: PlannedAction[]
  checks: Array<{ name: string; actionId: string; run: (output: unknown) => { passed: boolean; detail: string; evidence?: Evidence[] } }>
}

export interface Planner {
  plan: (task: Task) => AgentPlan
}

function demoPlanner(task: Task): AgentPlan {
  const goal = task.goal.trim()
  if (/calculate|compute|what is/i.test(goal)) {
    const expression = goal.match(/(?:calculate|compute|what is)\s+(.+)$/i)?.[1]?.replace(/[?]/g, '').trim() ?? ''
    const action = { id: 'a1', tool: 'calculate', input: { expression }, reason: 'The goal asks for an arithmetic result.' }
    return {
      actions: [action],
      checks: [{
        name: 'calculator produced a finite number', actionId: 'a1',
        run: output => ({ passed: typeof output === 'number' && Number.isFinite(output as number), detail: `Observed output: ${String(output)}.` }),
      }],
    }
  }

  if (/time|timestamp|date/i.test(goal)) {
    const action = { id: 'a1', tool: 'timestamp', input: undefined, reason: 'The goal asks for the runtime time.' }
    return {
      actions: [action],
      checks: [{
        name: 'timestamp is ISO formatted', actionId: 'a1',
        run: output => ({ passed: typeof output === 'string' && !Number.isNaN(Date.parse(output)), detail: `Observed output: ${String(output)}.` }),
      }],
    }
  }

  const action = { id: 'a1', tool: 'echo', input: { text: goal }, reason: 'No specialized tool matched, so AEGIS uses the read-only echo tool.' }
  return {
    actions: [action],
    checks: [{
      name: 'echo preserved the goal', actionId: 'a1',
      run: output => ({ passed: output === goal, detail: output === goal ? 'Output exactly matched the requested goal.' : 'Output differed from the requested goal.' }),
    }],
  }
}

export function runTask(task: Task, planner: Planner = { plan: demoPlanner }): { task: Task; plan: AgentPlan; events: RunEvent[]; result: VerificationResult; evidence: Evidence[] } {
  if (!task.goal.trim()) throw new Error('Task goal cannot be empty.')

  const plan = planner.plan(task)
  const events: RunEvent[] = plan.actions.map(action => ({ type: 'plan', action }))
  const outputs = new Map<string, unknown>()
  const evidence: Evidence[] = []

  for (const action of plan.actions) {
    const tool = getTool(action.tool)
    if (!tool) throw new Error(`Tool not permitted: ${action.tool}`)
    const result: ToolResult = tool.execute(action.input, { goal: task.goal })
    outputs.set(action.id, result.output)
    evidence.push(result.evidence)
    events.push({ type: 'execute', actionId: action.id, tool: action.tool, output: result.output })
  }

  const checks = plan.checks.map(check => ({
    name: check.name,
    run: () => {
      const result = check.run(outputs.get(check.actionId))
      const checkEvidence = result.evidence ?? [createEvidence('observation', result.detail, `check:${check.name}`)]
      return { ...result, evidence: checkEvidence }
    },
  }))
  const result = verify(checks)
  evidence.push(...result.evidence)
  events.push({ type: 'verify', result })

  return { task, plan, events, result, evidence }
}
