import { NextResponse } from 'next/server'
import { applyApprovedPatch, proposeFileReplacement } from '@/core/engineering'
import { runCheck, type CheckName } from '@/core/checks'

const root = process.cwd()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode = body?.mode

    if (mode === 'propose') {
      if (typeof body.path !== 'string' || typeof body.after !== 'string') {
        return NextResponse.json({ ok: false, error: 'path and after are required.' }, { status: 400 })
      }
      const proposal = proposeFileReplacement(root, body.path, body.after)
      return NextResponse.json({ ok: true, ...proposal })
    }

    if (mode === 'apply') {
      if (!body.patch || typeof body.patch.path !== 'string' || typeof body.patch.before !== 'string' || typeof body.patch.after !== 'string') {
        return NextResponse.json({ ok: false, error: 'A complete patch is required.' }, { status: 400 })
      }
      if (body.approved !== true) return NextResponse.json({ ok: false, error: 'Explicit approval is required.' }, { status: 403 })
      const evidence = applyApprovedPatch(root, body.patch, true)
      const checks: CheckName[] = ['typecheck', 'test', 'build']
      const results = checks.map(name => runCheck(name, root))
      const passed = results.every(result => result.passed)
      return NextResponse.json({ ok: true, status: passed ? 'PASS' : 'FAIL', evidence: [evidence, ...results.map(result => result.evidence)], checks: results })
    }

    return NextResponse.json({ ok: false, error: 'Unknown engineering mode.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Engineering task failed.' }, { status: 422 })
  }
}
