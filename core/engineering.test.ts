import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyApprovedPatch, proposeFileReplacement } from './engineering'

const roots: string[] = []

afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }) })

describe('controlled engineering changes', () => {
  it('proposes a replacement and refuses it without approval', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-')); roots.push(root)
    fs.writeFileSync(path.join(root, 'demo.txt'), 'before')
    const proposal = proposeFileReplacement(root, 'demo.txt', 'after')
    expect(proposal.patch.before).toBe('before')
    expect(() => applyApprovedPatch(root, proposal.patch, false)).toThrow(/approval/i)
    expect(fs.readFileSync(path.join(root, 'demo.txt'), 'utf8')).toBe('before')
  })

  it('applies an approved patch only if the file is unchanged', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-')); roots.push(root)
    fs.writeFileSync(path.join(root, 'demo.txt'), 'before')
    const proposal = proposeFileReplacement(root, 'demo.txt', 'after')
    const evidence = applyApprovedPatch(root, proposal.patch, true)
    expect(evidence.source).toBe('engineering:write')
    expect(fs.readFileSync(path.join(root, 'demo.txt'), 'utf8')).toBe('after')
  })
})
