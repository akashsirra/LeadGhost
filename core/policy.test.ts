import { describe, expect, it } from 'vitest'
import { decidePermission } from './policy'

describe('AEGIS policy', () => {
  it('allows read and test permissions by default', () => {
    expect(decidePermission('workspace.read').allowed).toBe(true)
    expect(decidePermission('process.test').allowed).toBe(true)
  })

  it('blocks writes until explicit approval', () => {
    const pending = decidePermission('workspace.write', ['workspace.write'])
    expect(pending.allowed).toBe(false)
    expect(pending.requiresApproval).toBe(true)
    expect(decidePermission('workspace.write', ['workspace.write'], true).allowed).toBe(true)
  })
})
