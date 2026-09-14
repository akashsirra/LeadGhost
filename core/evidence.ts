import type { Evidence, EvidenceKind } from './types'

export function createEvidence(kind: EvidenceKind, summary: string, source: string): Evidence {
  if (!summary.trim()) throw new Error('Evidence summary cannot be empty')
  if (!source.trim()) throw new Error('Evidence source cannot be empty')
  return {
    id: crypto.randomUUID(),
    kind,
    summary: summary.trim(),
    source: source.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function hasSufficientEvidence(evidence: Evidence[]): boolean {
  return evidence.length > 0 && evidence.every(item => Boolean(item.summary && item.source))
}
