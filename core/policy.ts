export type Permission = 'workspace.read' | 'workspace.write' | 'process.test' | 'git.read' | 'git.write' | 'network' | 'release'

export const DEFAULT_PERMISSIONS: Permission[] = ['workspace.read', 'git.read', 'process.test']

export interface PolicyDecision {
  allowed: boolean
  reason: string
  requiresApproval: boolean
}

export function decidePermission(permission: Permission, granted: Permission[] = DEFAULT_PERMISSIONS, approved = false): PolicyDecision {
  if (!granted.includes(permission)) return { allowed: false, reason: `Permission ${permission} is not granted.`, requiresApproval: permission === 'workspace.write' || permission === 'git.write' || permission === 'network' || permission === 'release' }
  if (permission === 'workspace.write' || permission === 'git.write' || permission === 'release') {
    return approved
      ? { allowed: true, reason: `Approved ${permission} operation.`, requiresApproval: true }
      : { allowed: false, reason: `${permission} requires explicit approval.`, requiresApproval: true }
  }
  return { allowed: true, reason: `Permission ${permission} is granted.`, requiresApproval: false }
}
