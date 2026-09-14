import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createEvidence } from './evidence'
import type { Evidence } from './types'

export interface ToolContext { goal: string; workspaceRoot?: string }
export interface ToolResult<T = unknown> { output: T; evidence: Evidence }
export interface Tool<I = unknown, O = unknown> { name: string; description: string; execute: (input: I, context: ToolContext) => ToolResult<O> }
type AnyTool = Tool<any, any>

const MAX_FILE_BYTES = 64 * 1024
const MAX_LIST_ENTRIES = 200
const MAX_DEPTH = 3
const MAX_GIT_OUTPUT = 30_000

function workspace(context: ToolContext): string {
  return path.resolve(context.workspaceRoot ?? process.cwd())
}

function isSensitive(relativePath: string): boolean {
  const name = path.basename(relativePath).toLowerCase()
  return name === '.env' || name.startsWith('.env.') || name.endsWith('.pem') || name.endsWith('.key') || name.includes('credentials')
}

function resolveWorkspacePath(context: ToolContext, relativePath: string): string {
  const root = workspace(context)
  const candidate = path.resolve(root, relativePath || '.')
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new Error('Path escapes the AEGIS workspace.')
  const normalized = path.relative(root, candidate)
  if (isSensitive(normalized)) throw new Error('Access to sensitive files is denied.')
  return candidate
}

function runGit(context: ToolContext, args: string[]): string {
  const root = workspace(context)
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 5000, maxBuffer: 256 * 1024 }).slice(0, MAX_GIT_OUTPUT)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Git command failed.'
    throw new Error(`Git read operation failed: ${message}`)
  }
}

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
    const op = ops.pop(); const b = values.pop(); const a = values.pop()
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
  execute: ({ expression }) => { const value = arithmetic(expression); return { output: value, evidence: createEvidence('tool', `Calculated ${expression} = ${value}.`, 'tool:calculate') } },
}

const timestamp: Tool<undefined, string> = {
  name: 'timestamp',
  description: 'Return the runtime clock as an ISO timestamp.',
  execute: () => { const value = new Date().toISOString(); return { output: value, evidence: createEvidence('observation', `Runtime clock: ${value}.`, 'tool:timestamp') } },
}

const listFiles: Tool<{ path?: string }, string[]> = {
  name: 'list_files',
  description: 'List workspace files recursively within a bounded read-only scope.',
  execute: ({ path: relativePath = '.' }, context) => {
    const start = resolveWorkspacePath(context, relativePath)
    const root = workspace(context)
    const results: string[] = []
    const walk = (directory: string, depth: number) => {
      if (depth > MAX_DEPTH || results.length >= MAX_LIST_ENTRIES) return
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name)
        const rel = path.relative(root, absolute) || entry.name
        if (entry.isSymbolicLink() || isSensitive(rel)) continue
        results.push(rel)
        if (entry.isDirectory()) walk(absolute, depth + 1)
        if (results.length >= MAX_LIST_ENTRIES) return
      }
    }
    walk(start, 0)
    results.sort()
    return { output: results, evidence: createEvidence('tool', `Listed ${results.length} workspace paths from ${relativePath}.`, 'tool:list_files') }
  },
}

const readFile: Tool<{ path: string }, string> = {
  name: 'read_file',
  description: 'Read a bounded UTF-8 workspace file without modifying it.',
  execute: ({ path: relativePath }, context) => {
    if (!relativePath?.trim()) throw new Error('A file path is required.')
    const filePath = resolveWorkspacePath(context, relativePath)
    const stat = fs.statSync(filePath)
    if (!stat.isFile()) throw new Error('Requested path is not a file.')
    if (stat.size > MAX_FILE_BYTES) throw new Error(`File exceeds the ${MAX_FILE_BYTES} byte read limit.`)
    const output = fs.readFileSync(filePath, 'utf8')
    return { output, evidence: createEvidence('tool', `Read ${stat.size} bytes from ${relativePath}.`, 'tool:read_file') }
  },
}

const gitStatus: Tool<undefined, string> = {
  name: 'git_status',
  description: 'Inspect repository status using a read-only Git command.',
  execute: (_, context) => { const output = runGit(context, ['status', '--short', '--branch']); return { output, evidence: createEvidence('tool', 'Captured git status --short --branch.', 'tool:git_status') } },
}

const gitDiff: Tool<{ path?: string }, string> = {
  name: 'git_diff',
  description: 'Inspect uncommitted Git changes without modifying the repository.',
  execute: ({ path: relativePath }, context) => {
    const args = ['diff', '--no-ext-diff', '--']
    if (relativePath) { resolveWorkspacePath(context, relativePath); args.push(relativePath) }
    const output = runGit(context, args)
    return { output, evidence: createEvidence('tool', `Captured git diff${relativePath ? ` for ${relativePath}` : ''}.`, 'tool:git_diff') }
  },
}

const gitLog: Tool<{ limit?: number }, string> = {
  name: 'git_log',
  description: 'Inspect recent repository history using a read-only Git command.',
  execute: ({ limit = 10 }, context) => {
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 20))
    const output = runGit(context, ['log', `-${safeLimit}`, '--oneline', '--decorate'])
    return { output, evidence: createEvidence('tool', `Captured the latest ${safeLimit} Git commits.`, 'tool:git_log') }
  },
}

export const defaultTools: AnyTool[] = [echo, calculate, timestamp, listFiles, readFile, gitStatus, gitDiff, gitLog]
export function getTool(name: string): AnyTool | undefined { return defaultTools.find(tool => tool.name === name) }
