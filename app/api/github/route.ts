import { NextResponse } from 'next/server'
import { createGitHubBranch, readGitHubFile, updateGitHubFile } from '@/core/github'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const repository = typeof body?.repository === 'string' ? body.repository.trim() : ''
    const filePath = typeof body?.path === 'string' ? body.path.trim() : ''
    const ref = typeof body?.ref === 'string' && body.ref.trim() ? body.ref.trim() : 'main'
    if (!repository || !filePath) return NextResponse.json({ ok: false, error: 'repository and path are required.' }, { status: 400 })

    if (body.mode === 'read') {
      const file = await readGitHubFile(repository, filePath, ref)
      return NextResponse.json({ ok: true, file })
    }

    if (body.mode === 'apply') {
      if (body.approved !== true) return NextResponse.json({ ok: false, error: 'Explicit approval is required.' }, { status: 403 })
      if (typeof body.content !== 'string') return NextResponse.json({ ok: false, error: 'content is required.' }, { status: 400 })
      if (!process.env.GITHUB_TOKEN) return NextResponse.json({ ok: false, error: 'GITHUB_TOKEN is not configured on the server.' }, { status: 503 })
      const current = await readGitHubFile(repository, filePath, ref)
      if (body.expectedSha && body.expectedSha !== current.sha) return NextResponse.json({ ok: false, error: 'Remote file changed since the proposal was created.' }, { status: 409 })
      const branch = `aegis/${crypto.randomUUID().slice(0, 8)}`
      await createGitHubBranch(repository, branch, ref)
      const commitSha = await updateGitHubFile(repository, filePath, current.sha, body.content, branch, typeof body.message === 'string' ? body.message : 'feat: apply approved aegis change')
      return NextResponse.json({ ok: true, branch, commitSha })
    }

    return NextResponse.json({ ok: false, error: 'Unknown GitHub mode.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'GitHub operation failed.' }, { status: 422 })
  }
}
