import { describe, expect, it } from 'vitest'
import { createEvidence } from './evidence'
import { verify } from './verifier'

describe('AEGIS verifier', () => {
  const evidence = () => createEvidence('test', 'verified', 'vitest')

  it('returns UNKNOWN when no checks exist', () => {
    expect(verify([]).status).toBe('UNKNOWN')
  })

  it('returns UNKNOWN when a passing check has no evidence', () => {
    const result = verify([{ name: 'build', run: () => ({ passed: true, detail: 'build passed' }) }])
    expect(result.status).toBe('UNKNOWN')
  })

  it('returns UNKNOWN when one check lacks evidence even if another has it', () => {
    const result = verify([
      { name: 'build', run: () => ({ passed: true, detail: 'build passed', evidence: [evidence()] }) },
      { name: 'tests', run: () => ({ passed: true, detail: 'tests passed' }) },
    ])
    expect(result.status).toBe('UNKNOWN')
  })

  it('returns FAIL when a check fails with evidence', () => {
    const result = verify([{
      name: 'test',
      run: () => ({ passed: false, detail: 'test failed', evidence: [evidence()] }),
    }])
    expect(result.status).toBe('FAIL')
  })

  it('returns PASS only when every check passes with evidence', () => {
    const result = verify([
      { name: 'build', run: () => ({ passed: true, detail: 'build passed', evidence: [evidence()] }) },
      { name: 'tests', run: () => ({ passed: true, detail: 'tests passed', evidence: [evidence()] }) },
    ])
    expect(result.status).toBe('PASS')
  })
})
