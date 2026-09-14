import { NextResponse } from 'next/server'
import { runTask } from '@/core/runtime'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body.goal !== 'string' || !body.goal.trim()) {
      return NextResponse.json({ ok: false, error: 'A task goal is required.' }, { status: 400 })
    }

    const constraints = Array.isArray(body.constraints)
      ? body.constraints.filter((value: unknown): value is string => typeof value === 'string').slice(0, 20)
      : []

    const task = {
      id: crypto.randomUUID(),
      goal: body.goal.trim().slice(0, 4000),
      constraints,
      createdAt: new Date().toISOString(),
    }

    const run = runTask(task)
    return NextResponse.json({ ok: true, ...run })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Task failed.' }, { status: 422 })
  }
}
