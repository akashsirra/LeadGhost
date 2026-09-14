import { NextRequest, NextResponse } from 'next/server'

type Message = { role: 'user' | 'assistant'; content: string }

const MODEL = process.env.XAI_MODEL || 'grok-4.6'

export async function POST(request: NextRequest) {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'XAI_API_KEY is not configured on the server.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const messages = Array.isArray(body?.messages) ? body.messages : []
  if (!messages.length) {
    return NextResponse.json({ error: 'Send at least one message.' }, { status: 400 })
  }

  const input = messages
    .filter((m: Message) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-30)
    .map((m: Message) => ({ role: m.role, content: m.content }))

  const upstream = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      tools: [{ type: 'web_search' }],
      temperature: 0.7,
    }),
  })

  const data = await upstream.json().catch(() => ({}))
  if (!upstream.ok) {
    return NextResponse.json(
      { error: data?.error?.message || data?.error || `xAI request failed (${upstream.status})` },
      { status: upstream.status },
    )
  }

  const text = typeof data.output_text === 'string'
    ? data.output_text
    : Array.isArray(data.output)
      ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).map((part: any) => part?.text || '').filter(Boolean).join('\n')
      : ''

  return NextResponse.json({
    message: text || 'I got a response, but could not extract its text.',
    model: MODEL,
    responseId: data.id || null,
  })
}
