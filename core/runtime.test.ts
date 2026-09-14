import { describe, expect, it } from 'vitest'
import { runTask } from './runtime'

describe('AEGIS runtime', () => {
  it('executes, observes, verifies and records evidence for arithmetic', () => {
    const run = runTask({ id: 't1', goal: 'calculate 7 * 6', constraints: [], createdAt: new Date().toISOString() })
    expect(run.plan.actions[0]?.tool).toBe('calculate')
    expect(run.events.some(event => event.type === 'execute')).toBe(true)
    expect(run.result.status).toBe('PASS')
    expect(run.evidence.length).toBeGreaterThanOrEqual(2)
  })

  it('uses a safe fallback for an unsupported goal instead of inventing a tool', () => {
    const run = runTask({ id: 't2', goal: 'repeat this exact phrase', constraints: [], createdAt: new Date().toISOString() })
    expect(run.plan.actions[0]?.tool).toBe('echo')
    expect(run.result.status).toBe('PASS')
  })

  it('performs a multi-step repository inspection before returning a verdict', () => {
    const run = runTask({ id: 't3', goal: 'audit this repository', constraints: [], createdAt: new Date().toISOString() }, undefined, process.cwd())
    expect(run.plan.actions.map(action => action.tool)).toEqual(['list_files', 'git_status', 'read_file'])
    expect(run.events.filter(event => event.type === 'execute')).toHaveLength(3)
    expect(run.result.status).toBe('PASS')
    expect(run.result.checks).toHaveLength(3)
    expect(run.result.evidence.length).toBeGreaterThanOrEqual(3)
  })
})
