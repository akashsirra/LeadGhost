import type { Evidence, VerificationResult } from './types'

export interface VerificationCheck {
  name: string
  run: () => { passed: boolean; detail: string; evidence?: Evidence[] }
}

export function verify(checks: VerificationCheck[]): VerificationResult {
  if (checks.length === 0) return { status: 'UNKNOWN', checks: [], evidence: [] }

  const results = checks.map(check => {
    const result = check.run()
    const evidence = result.evidence ?? []
    return { name: check.name, passed: result.passed, detail: result.detail, evidence }
  })

  const evidence = results.flatMap(result => result.evidence)
  const everyCheckHasEvidence = results.every(result =>
    result.evidence.length > 0 && result.evidence.every(item => Boolean(item.summary.trim() && item.source.trim()))
  )

  const checksForResult = results.map(({ name, passed, detail }) => ({ name, passed, detail }))
  if (!everyCheckHasEvidence) return { status: 'UNKNOWN', checks: checksForResult, evidence }

  return {
    status: results.every(result => result.passed) ? 'PASS' : 'FAIL',
    checks: checksForResult,
    evidence,
  }
}
