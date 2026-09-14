export interface ApprovalRequest {
  id: string
  action: 'workspace.write' | 'git.write' | 'release'
  summary: string
  paths: string[]
  createdAt: string
}

export function createApprovalRequest(action: ApprovalRequest['action'], summary: string, paths: string[] = []): ApprovalRequest {
  if (!summary.trim()) throw new Error('Approval summary cannot be empty.')
  return { id: crypto.randomUUID(), action, summary: summary.trim(), paths, createdAt: new Date().toISOString() }
}
