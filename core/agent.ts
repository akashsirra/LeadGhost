import { createEvidence } from './evidence'
import { getTool, type ToolResult } from './tools'
import type { Evidence, Task, VerificationResult } from './types'

const MODEL = process.env.AEGIS_MODEL || 'gpt-6-astra'
const MAX_STEPS = 12

type AgentEvent =
  | { type: 'plan'; action: { id: string; tool: string; input: unknown; reason: string } }
  | { type: 'execute'; actionId: string; tool: string; output: unknown }
  | { type: 'model'; summary: string }
  | { type: 'verify'; result: VerificationResult }

export interface AgentRun {
  mode: 'model'
  model: string
  summary: string
  events: AgentEvent[]
  evidence: Evidence[]
  result: VerificationResult
}

type ResponseItem = {
  type?: string
  id?: string
  call_id?: string
  name?: string
  arguments?: string
  output_text?: string
  content?: Array<{ type?: string; text?: string }>
}

function toolDefinitions() {
  return [
    { type: 'function', name: 'list_files', description: 'List workspace files recursively within the bounded read-only scope.', parameters: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false } },
    { type: 'function', name: 'read_file', description: 'Read a bounded UTF-8 workspace file without modifying it. Sensitive files are denied.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } },
    { type: 'function', name: 'git_status', description: 'Inspect repository status without modifying the repository.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'git_diff', description: 'Inspect uncommitted Git changes without modifying the repository.', parameters: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false } },
    { type: 'function', name: 'git_log', description: 'Inspect recent repository history without modifying the repository.', parameters: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 20 } }, additionalProperties: false } },
    { type: 'function', name: 'calculate', description: 'Evaluate basic arithmetic without dynamic code execution.', parameters: { type: 'object', properties: { expression: { type: 'string' } }, required: ['expression'], additionalProperties: false } },
    { type: 'function', name: 'timestamp', description: 'Return the runtime clock as an ISO timestamp.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'echo', description: 'Return user-provided text unchanged.', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false } },
  ]
}

function extractText(items: ResponseItem[]): string {
  const direct = items.find(item => typeof item.output_text === 'string')?.output_text
  if (direct) return direct
  return items.flatMap(item => item.content ?? []).map(part => part.text ?? '').join('\n').trim()
}

function safeJson(value: string | undefined): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  } catch {
    throw new Error('Model returned invalid tool arguments.')
  }
}

async function callModel(input: unknown[], system: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not configured; using the deterministic planner.')
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, reasoning: { effort: 'medium' }, instructions: system, input, tools: toolDefinitions() }),
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 2000)
    throw new Error(`Model request failed (${response.status}): ${detail}`)
  }
  return await response.json() as { output?: ResponseItem[] }
}

export async function runModelAgent(task: Task, workspaceRoot?: string): Promise<AgentRun> {
  const events: AgentEvent[] = []
  const evidence: Evidence[] = []
  const system = [
    'You are the planning intelligence inside AEGIS, an evidence-first engineering agent.',
    'AEGIS is the authority: you may propose read-only tool calls, but you never have direct filesystem, git, network, write, release, or secret access.',
    'Inspect before concluding. Prefer multiple independent observations when useful.',
    'Never claim that a task succeeded merely because you reasoned that it should. Only actual tool observations are evidence.',
    'Do not access secrets or sensitive files. Do not invent tool results.',
    'For this first model mode, stay read-only. If the user asks for changes, explain what should be changed but do not modify anything.',
    `The user goal is: ${task.goal}`,
    task.constraints.length ? `Constraints: ${task.constraints.join('; ')}` : 'No additional constraints were supplied.',
  ].join('\n')

  let input: unknown[] = [{ role: 'user', content: task.goal }]
  let summary = ''

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const response = await callModel(input, system)
    const output = response.output ?? []
    input = [...input, ...output]
    const calls = output.filter(item => item.type === 'function_call' && item.name && item.call_id)

    if (calls.length === 0) {
      summary = extractText(output) || 'The model completed its reasoning without a final summary.'
      evidence.push(createEvidence('observation', summary, `model:${MODEL}`))
      events.push({ type: 'model', summary })
      break
    }

    for (const call of calls) {
      const toolName = call.name!
      const tool = getTool(toolName)
      const actionId = call.call_id!
      const toolInput = safeJson(call.arguments)
      if (!tool) {
        const error = `Tool ${toolName} is not permitted by AEGIS.`
        evidence.push(createEvidence('observation', error, `policy:${toolName}`))
        input.push({ type: 'function_call_output', call_id: actionId, output: JSON.stringify({ error }) })
        continue
      }

      events.push({ type: 'plan', action: { id: actionId, tool: toolName, input: toolInput, reason: 'Model proposed this read-only observation.' } })
      try {
        const result: ToolResult = tool.execute(toolInput, { goal: task.goal, workspaceRoot })
        evidence.push(result.evidence)
        events.push({ type: 'execute', actionId, tool: toolName, output: result.output })
        input.push({ type: 'function_call_output', call_id: actionId, output: JSON.stringify(result.output) })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed.'
        const item = createEvidence('observation', message, `tool:${toolName}:error`)
        evidence.push(item)
        events.push({ type: 'execute', actionId, tool: toolName, output: { error: message } })
        input.push({ type: 'function_call_output', call_id: actionId, output: JSON.stringify({ error: message }) })
      }
    }
  }

  if (!summary) summary = 'The model reached the AEGIS step limit before producing a final summary.'
  const result: VerificationResult = {
    status: evidence.length > 0 ? 'UNKNOWN' : 'UNKNOWN',
    checks: [{ name: 'model conclusion', passed: false, detail: 'Model output is not proof of task success; an objective verifier is required.' }],
    evidence,
  }
  events.push({ type: 'verify', result })
  return { mode: 'model', model: MODEL, summary, events, evidence, result }
}
