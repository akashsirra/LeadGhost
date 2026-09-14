import { execFileSync } from 'node:child_process'
import { createEvidence } from './evidence'

export type CheckName = 'test' | 'typecheck' | 'build'

const COMMANDS: Record<CheckName, { command: string; args: string[] }> = {
  test: { command: 'npm', args: ['test'] },
  typecheck: { command: 'npm', args: ['run', 'typecheck'] },
  build: { command: 'npm', args: ['run', 'build'] },
}

export interface CheckResult {
  name: CheckName
  passed: boolean
  output: string
  evidence: ReturnType<typeof createEvidence>
}

export function runCheck(name: CheckName, cwd: string): CheckResult {
  const spec = COMMANDS[name]
  try {
    const output = execFileSync(spec.command, spec.args, { cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 512 * 1024 })
    return { name, passed: true, output: output.slice(-30_000), evidence: createEvidence('test', `${name} completed successfully.`, `check:${name}`) }
  } catch (error) {
    const output = error instanceof Error ? error.message : 'Check failed.'
    return { name, passed: false, output: output.slice(-30_000), evidence: createEvidence('test', `${name} failed.`, `check:${name}`) }
  }
}
