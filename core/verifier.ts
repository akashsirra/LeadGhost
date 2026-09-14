import type { Evidence, VerificationResult } from './types'
import { hasSufficientEvidence } from './evidence'

export interface VerificationCheck {
  name: string
  run: () => { passed: boolean; detail: string; evidence?: Evidence[] }
}

export function verify(checks: VerificationCheck[]): VerificationResult {
  if (checks.length === 0) {
    return { status: 'UNKNOWN', checks: [], evidence: [] }
  }

  const results = checks.map(check => {
    const result = check.run()
    return {
      name: check.name,
      passed: result.passed,
      detail: result.detail,
      evidence: result.evidence ?? [],
    }
  })

  const evidence = results.flatMap(result => result.evidence)
  const allPassed = results.every(result => result.passed)

  if (!hasSufficientEvidence(evidence)) {
    return {
      status: 'UNKNOWN',
      checks: results.map(({ name, passed, detail }) => ({ name, passed, detail })),
      evidence,
    }
  }

  return {
    status: allPassed ? 'PASS' : 'FAIL',
    checks: results.map(({ name, passed, detail }) => ({ name, passed, detail })),
    evidence,
  }
}
