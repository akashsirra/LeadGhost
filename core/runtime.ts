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

function singleCheck(name: string, actionId: string, run: (output: unknown) => { passed: boolean; detail: string; evidence?: Evidence[] }) {
  return [{ name, actionId, run }]
}

function demoPlanner(task: Task): AgentPlan {
  const goal = task.goal.trim()

  if (/\b(audit|inspect|analy[sz]e)\b.*\b(repo|repository|workspace|project)\b/i.test(goal)) {
    const actions: PlannedAction[] = [
      { id: 'a1', tool: 'list_files', input: { path: '.' }, reason: 'Inspect the workspace structure before drawing conclusions.' },
      { id: 'a2', tool: 'git_status', input: undefined, reason: 'Capture repository state as independent evidence.' },
      { id: 'a3', tool: 'read_file', input: { path: 'package.json' }, reason: 'Inspect the project manifest to identify runtime and available checks.' },
    ]
    return {
      actions,
      checks: [
        ...singleCheck('workspace listing returned an array', 'a1', output => ({ passed: Array.isArray(output), detail: `Observed ${Array.isArray(output) ? output.length : 0} paths.` })),
        ...singleCheck('git status returned text', 'a2', output => ({ passed: typeof output === 'string', detail: `Observed ${typeof output === 'string' ? output.length : 0} characters of repository status.` })),
        ...singleCheck('project manifest returned text', 'a3', output => ({ passed: typeof output === 'string' && output.trim().length > 0, detail: `Observed ${typeof output === 'string' ? output.length : 0} characters of package metadata.` })),
      ],
    }
  }

  if (/\b(list|show|inspect)\b.*\b(files|folders|directory|repo|repository)\b/i.test(goal)) {
    const relativePath = goal.match(/(?:in|under|at)\s+([\w./-]+)\s*$/i)?.[1] ?? '.'
    const action = { id: 'a1', tool: 'list_files', input: { path: relativePath }, reason: 'The goal asks AEGIS to inspect workspace structure.' }
    return { actions: [action], checks: singleCheck('filesystem listing returned an array', 'a1', output => ({ passed: Array.isArray(output), detail: `Observed ${Array.isArray(output) ? output.length : 0} paths.` })) }
  }

  if (/\b(read|open|inspect)\b.*\b(file|source|code)\b/i.test(goal)) {
    const relativePath = goal.match(/(?:file|source|code)\s+([\w./-]+)\s*$/i)?.[1] ?? goal.match(/(?:read|open|inspect)\s+([\w./-]+)\s*$/i)?.[1] ?? ''
    const action = { id: 'a1', tool: 'read_file', input: { path: relativePath }, reason: 'The goal asks AEGIS to inspect a specific workspace file.' }
    return { actions: [action], checks: singleCheck('file read returned text', 'a1', output => ({ passed: typeof output === 'string', detail: `Observed ${typeof output === 'string' ? `${output.length} characters` : 'non-text output'}.` })) }
  }

  if (/\bgit\s+status\b|\bstatus\b.*\brepo(sitory)?\b/i.test(goal)) {
    const action = { id: 'a1', tool: 'git_status', input: undefined, reason: 'The goal asks for repository status.' }
    return { actions: [action], checks: singleCheck('git status returned text', 'a1', output => ({ passed: typeof output === 'string', detail: `Observed ${String(output).length} characters of status output.` })) }
  }

  if (/\bgit\s+diff\b|\bshow\b.*\bchanges\b/i.test(goal)) {
    const relativePath = goal.match(/(?:for|in)\s+([\w./-]+)\s*$/i)?.[1]
    const action = { id: 'a1', tool: 'git_diff', input: relativePath ? { path: relativePath } : {}, reason: 'The goal asks AEGIS to inspect uncommitted changes.' }
    return { actions: [action], checks: singleCheck('git diff returned text', 'a1', output => ({ passed: typeof output === 'string', detail: `Observed ${String(output).length} characters of diff output.` })) }
  }

  if (/\bgit\s+(log|history)\b|\bcommit history\b/i.test(goal)) {
    const action = { id: 'a1', tool: 'git_log', input: { limit: 10 }, reason: 'The goal asks for recent repository history.' }
    return { actions: [action], checks: singleCheck('git history returned text', 'a1', output => ({ passed: typeof output === 'string', detail: `Observed ${String(output).length} characters of history output.` })) }
  }

  if (/calculate|compute|what is/i.test(goal)) {
    const expression = goal.match(/(?:calculate|compute|what is)\s+(.+)$/i)?.[1]?.replace(/[?]/g, '').trim() ?? ''
    const action = { id: 'a1', tool: 'calculate', input: { expression }, reason: 'The goal asks for an arithmetic result.' }
    return { actions: [action], checks: singleCheck('calculator produced a finite number', 'a1', output => ({ passed: typeof output === 'number' && Number.isFinite(output as number), detail: `Observed output: ${String(output)}.` })) }
  }

  if (/time|timestamp|date/i.test(goal)) {
    const action = { id: 'a1', tool: 'timestamp', input: undefined, reason: 'The goal asks for the runtime time.' }
    return { actions: [action], checks: singleCheck('timestamp is ISO formatted', 'a1', output => ({ passed: typeof output === 'string' && !Number.isNaN(Date.parse(output)), detail: `Observed output: ${String(output)}.` })) }
  }

  const action = { id: 'a1', tool: 'echo', input: { text: goal }, reason: 'No specialized tool matched, so AEGIS uses the read-only echo tool.' }
  return { actions: [action], checks: singleCheck('echo preserved the goal', 'a1', output => ({ passed: output === goal, detail: output === goal ? 'Output exactly matched the requested goal.' : 'Output differed from the requested goal.' })) }
}

export function runTask(task: Task, planner: Planner = { plan: demoPlanner }, workspaceRoot?: string): { task: Task; plan: AgentPlan; events: RunEvent[]; result: VerificationResult; evidence: Evidence[] } {
  if (!task.goal.trim()) throw new Error('Task goal cannot be empty.')

  const plan = planner.plan(task)
  const events: RunEvent[] = plan.actions.map(action => ({ type: 'plan', action }))
  const outputs = new Map<string, unknown>()
  const evidence: Evidence[] = []

  for (const action of plan.actions) {
    const tool = getTool(action.tool)
    if (!tool) throw new Error(`Tool not permitted: ${action.tool}`)
    const result: ToolResult = tool.execute(action.input, { goal: task.goal, workspaceRoot })
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
