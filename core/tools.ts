import { createEvidence } from './evidence'
import type { Evidence } from './types'

export interface ToolContext {
  goal: string
}

export interface ToolResult<T = unknown> {
  output: T
  evidence: Evidence
}

export interface Tool<I = unknown, O = unknown> {
  name: string
  description: string
  execute: (input: I, context: ToolContext) => ToolResult<O>
}

const echo: Tool<{ text: string }, string> = {
  name: 'echo',
  description: 'Return user-provided text without changing it.',
  execute: ({ text }) => ({
    output: text,
    evidence: createEvidence('tool', `Echoed ${text.length} characters.`, 'tool:echo'),
  }),
}

const calculate: Tool<{ expression: string }, number> = {
  name: 'calculate',
  description: 'Evaluate a basic arithmetic expression using numbers and + - * / ( ).',
  execute: ({ expression }) => {
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) throw new Error('Calculator only accepts basic arithmetic.')
    const value = Function(`"use strict"; return (${expression})`)()
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expression did not produce a finite number.')
    return {
      output: value,
      evidence: createEvidence('tool', `Calculated ${expression} = ${value}.`, 'tool:calculate'),
    }
  },
}

const timestamp: Tool<undefined, string> = {
  name: 'timestamp',
  description: 'Return the runtime clock as an ISO timestamp.',
  execute: () => {
    const value = new Date().toISOString()
    return { output: value, evidence: createEvidence('observation', `Runtime clock: ${value}.`, 'tool:timestamp') }
  },
}

export const defaultTools: Tool[] = [echo, calculate, timestamp]

export function getTool(name: string): Tool | undefined {
  return defaultTools.find(tool => tool.name === name)
}
