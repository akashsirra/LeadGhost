import { NextRequest, NextResponse } from 'next/server'

type Message = { role: 'user' | 'assistant'; content: string }

const MODEL = process.env.GROQ_MODEL || 'groq/compound'

const SYSTEM_PROMPT = `You are BROK, a fast, practical agent inside LeadGhost.

Your job is to help the user get things done, not merely chat. For questions that benefit from current information, research the web using your built-in tools. For calculations or data work, use code execution when useful. Visit relevant public websites when primary-source information matters.

Be decisive and concise. Prefer verified facts over guesses. When you use web research, preserve the citations provided by the platform. If the user asks for a task, reason about the best path, do the available work, verify important results, and clearly state what you completed and what still requires the user.`

function getApiKeys() {
  return [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY,
  ].filter((key): key is string => Boolean(key))
}

export async function POST(request: NextRequest) {
  const apiKeys = getApiKeys()
  if (!apiKeys.length) {
    return NextResponse.json(
      { error: 'No Groq API key is configured on the server.' },
      { status: 503 },
    )
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

  let lastData: any = {}
  let lastStatus = 500
  let lastError = 'Groq request failed.'

  for (const apiKey of apiKeys) {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...input,
        ],
        citation_options: 'enabled',
      }),
    })

    const data = await upstream.json().catch(() => ({}))
    lastData = data
    lastStatus = upstream.status

    if (upstream.ok) {
      const message = data?.choices?.[0]?.message
      const text = typeof message?.content === 'string' ? message.content : ''
      const executedTools = Array.isArray(message?.executed_tools)
        ? message.executed_tools.map((tool: any) => tool?.type || 'tool').filter(Boolean)
        : []

      return NextResponse.json({
        message: text || 'I got a response, but could not extract its text.',
        model: MODEL,
        responseId: data.id || null,
        toolsUsed: [...new Set(executedTools)],
      })
    }

    lastError = data?.error?.message || data?.error || `Groq request failed (${upstream.status})`

    // A second key is useful as a safety valve for rate limits/transient failures.
    if (upstream.status !== 429 && upstream.status < 500) break
  }

  return NextResponse.json(
    { error: lastError, model: MODEL },
    { status: lastStatus || 500 },
  )
}
