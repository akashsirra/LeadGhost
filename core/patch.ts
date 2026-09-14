export interface FilePatch {
  path: string
  before: string
  after: string
}

export function createFilePatch(path: string, before: string, after: string): FilePatch {
  if (!path.trim()) throw new Error('Patch path cannot be empty.')
  if (before === after) throw new Error('Patch must change file content.')
  return { path, before, after }
}

export function changedLineCount(patch: FilePatch): number {
  const before = new Set(patch.before.split('\n'))
  const after = new Set(patch.after.split('\n'))
  let changed = 0
  for (const line of patch.before.split('\n')) if (!after.has(line)) changed += 1
  for (const line of patch.after.split('\n')) if (!before.has(line)) changed += 1
  return changed
}
