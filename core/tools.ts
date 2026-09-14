import { createEvidence } from './evidence'
import type { Evidence } from './types'

export interface ToolContext { goal: string }
export interface ToolResult<T = unknown> { output: T; evidence: Evidence }
export interface Tool<I = unknown, O = unknown> { name: string; description: string; execute: (input: I, context: ToolContext) => ToolResult<O> }

const echo: Tool<{ text: string }, string> = {
  name: 'echo',
  description: 'Return user-provided text without changing it.',
  execute: ({ text }) => ({ output: text, evidence: createEvidence('tool', `Echoed ${text.length} characters.`, 'tool:echo') }),
}

function arithmetic(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/()]|\s+/g)
  if (!tokens || tokens.join('') !== expression || !expression.trim()) throw new Error('Calculator accepts only numbers, + - * / and parentheses.')
  const values: number[] = []
  const ops: string[] = []
  const precedence = (op: string) => op === '+' || op === '-' ? 1 : 2
  const apply = () => {
    const op = ops.pop()
    const b = values.pop()
    const a = values.pop()
    if (!op || a === undefined || b === undefined) throw new Error('Invalid arithmetic expression.')
    if (op === '/' && b === 0) throw new Error('Division by zero.')
    values.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b)
  }
  let expectValue = true
  for (const token of tokens) {
    if (/^\s+$/.test(token)) continue
    if (/^\d/.test(token)) { if (!expectValue) throw new Error('Missing operator.'); values.push(Number(token)); expectValue = false; continue }
    if (token === '(') { if (!expectValue) throw new Error('Missing operator.'); ops.push(token); continue }
    if (token === ')') { if (expectValue) throw new Error('Missing value.'); while (ops.length && ops.at(-1) !== '(') apply(); if (ops.pop() !== '(') throw new Error('Unbalanced parentheses.'); expectValue = false; continue }
    if (expectValue && (token === '+' || token === '-')) { if (token === '-') values.push(0); else continue }
    else if (expectValue) throw new Error('Expected a number.')
    while (ops.length && ops.at(-1) !== '(' && precedence(ops.at(-1)!) >= precedence(token)) apply()
    ops.push(token); expectValue = true
  }
  if (expectValue) throw new Error('Expression ended unexpectedly.')
  while (ops.length) { if (ops.at(-1) === '(') throw new Error('Unbalanced parentheses.'); apply() }
  const value = values[0]
  if (values.length !== 1 || !Number.isFinite(value)) throw new Error('Expression did not produce a finite number.')
  return value
}

const calculate: Tool<{ expression: string }, number> = {
  name: 'calculate',
  description: 'Evaluate basic arithmetic without dynamic code execution.',
  execute: ({ expression }) => {
    const value = arithmetic(expression)
    return { output: value, evidence: createEvidence('tool', `Calculated ${expression} = ${value}.`, 'tool:calculate') }
  },
}

const timestamp: Tool<undefined, string> = {
  name: 'timestamp',
  description: 'Return the runtime clock as an ISO timestamp.',
  execute: () => { const value = new Date().toISOString(); return { output: value, evidence: createEvidence('observation', `Runtime clock: ${value}.`, 'tool:timestamp') } },
}

export const defaultTools: Tool[] = [echo, calculate, timestamp]
export function getTool(name: string): Tool | undefined { return defaultTools.find(tool => tool.name === name) }
