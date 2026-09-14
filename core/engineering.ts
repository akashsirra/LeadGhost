import fs from 'node:fs'
import path from 'node:path'
import { createEvidence } from './evidence'
import { createApprovalRequest } from './approval'
import { createFilePatch, type FilePatch } from './patch'
import { decidePermission } from './policy'

const MAX_WRITE_BYTES = 64 * 1024

function resolve(root: string, relativePath: string): string {
  const base = path.resolve(root)
  const target = path.resolve(base, relativePath)
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error('Path escapes the AEGIS workspace.')
  const name = path.basename(relativePath).toLowerCase()
  if (name === '.env' || name.startsWith('.env.') || name.endsWith('.pem') || name.endsWith('.key') || name.includes('credentials')) throw new Error('Access to sensitive files is denied.')
  return target
}

export interface ChangeProposal {
  patch: FilePatch
  approval: ReturnType<typeof createApprovalRequest>
  evidence: ReturnType<typeof createEvidence>[]
}

export function proposeFileReplacement(root: string, relativePath: string, after: string): ChangeProposal {
  if (Buffer.byteLength(after, 'utf8') > MAX_WRITE_BYTES) throw new Error(`Replacement exceeds the ${MAX_WRITE_BYTES} byte limit.`)
  const target = resolve(root, relativePath)
  const before = fs.readFileSync(target, 'utf8')
  const patch = createFilePatch(relativePath, before, after)
  const approval = createApprovalRequest('workspace.write', `Replace ${relativePath} after verification.`, [relativePath])
  const evidence = [createEvidence('artifact', `Prepared a bounded replacement for ${relativePath}.`, 'engineering:proposal')]
  return { patch, approval, evidence }
}

export function applyApprovedPatch(root: string, patch: FilePatch, approved: boolean) {
  const decision = decidePermission('workspace.write', ['workspace.write'], approved)
  if (!decision.allowed) throw new Error(decision.reason)
  const target = resolve(root, patch.path)
  const current = fs.readFileSync(target, 'utf8')
  if (current !== patch.before) throw new Error('Workspace changed since proposal; refusing stale patch.')
  fs.writeFileSync(target, patch.after, 'utf8')
  return createEvidence('artifact', `Applied approved replacement to ${patch.path}.`, 'engineering:write')
}
