import { describe, expect, it } from 'vitest'
import { createEvidence } from './evidence'
import { verify } from './verifier'

describe('AEGIS verifier', () => {
  it('returns UNKNOWN when no checks exist', () => {
    expect(verify([]).status).toBe('UNKNOWN')
  })

  it('returns UNKNOWN when a passing check has no evidence', () => {
    const result = verify([{ name: 'build', run: () => ({ passed: true, detail: 'build passed' }) }])
    expect(result.status).toBe('UNKNOWN')
  })

  it('returns FAIL when a check fails with evidence', () => {
    const result = verify([{
      name: 'test',
      run: () => ({ passed: false, detail: 'test failed', evidence: [createEvidence('test', 'assertion failed', 'vitest')] }),
    }])
    expect(result.status).toBe('FAIL')
  })

  it('returns PASS only when checks pass and evidence exists', () => {
    const result = verify([{
      name: 'build',
      run: () => ({ passed: true, detail: 'build passed', evidence: [createEvidence('test', 'build completed', 'tsc')] }),
    }])
    expect(result.status).toBe('PASS')
  })
})
