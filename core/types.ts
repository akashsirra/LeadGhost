export type RunStatus = 'RUNNING' | 'PASS' | 'FAIL' | 'UNKNOWN'

export type EvidenceKind = 'tool' | 'test' | 'observation' | 'artifact'

export interface Evidence {
  id: string
  kind: EvidenceKind
  summary: string
  source: string
  createdAt: string
}

export interface VerificationResult {
  status: Exclude<RunStatus, 'RUNNING'>
  checks: Array<{ name: string; passed: boolean; detail: string }>
  evidence: Evidence[]
}

export interface Task {
  id: string
  goal: string
  constraints: string[]
  createdAt: string
}
