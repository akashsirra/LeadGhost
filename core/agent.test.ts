import { afterEach, describe, expect, test, vi } from 'vitest'
import { runModelAgent } from './agent'

const originalKey = process.env.OPENAI_API_KEY

afterEach(() => {
  vi.restoreAllMocks()
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = originalKey
})

describe('model agent', () => {
  test('executes a permitted read-only tool and records evidence', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output: [{ type: 'function_call', call_id: 'call_1', name: 'git_status', arguments: '{}' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        output: [{ type: 'message', output_text: 'I inspected the repository status.' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }))

    const run = await runModelAgent({ id: 'task-1', goal: 'inspect repository status', constraints: [], createdAt: new Date().toISOString() }, process.cwd())

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(run.events.some(event => event.type === 'execute' && event.tool === 'git_status')).toBe(true)
    expect(run.evidence.some(item => item.source === 'tool:git_status')).toBe(true)
    expect(run.result.status).toBe('UNKNOWN')
  })
})
