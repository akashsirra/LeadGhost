'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

const starterPrompts = [
  'What is happening in AI right now?',
  'Research the best free tools for building an AI agent.',
  'Help me turn an idea into a real product.',
]

type Message = { role: 'user' | 'assistant'; content: string }

export default function BrokPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(text = input) {
    const value = text.trim()
    if (!value || loading) return
    const next = [...messages, { role: 'user' as const, content: value }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages([...next, { role: 'assistant', content: data.message }])
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: `⚠️ ${error instanceof Error ? error.message : 'Something went wrong.'}` }])
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void sendMessage()
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <header className="sticky top-0 z-10 border-b border-[#202026] bg-[#07070a]/90 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black">✦</span>
            <div><div className="font-semibold tracking-tight">BROK</div><div className="text-[10px] uppercase tracking-[.2em] text-[#777782]">Grok-powered AI</div></div>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#85858f]"><span className="h-2 w-2 rounded-full bg-[#b7ff3c]"/> Live web search</div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col px-4 pb-5 pt-8 md:px-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center pb-20">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-white to-[#777] text-3xl text-black shadow-2xl">✦</div>
              <h1 className="text-4xl font-semibold tracking-[-.04em] md:text-5xl">What are we figuring out?</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#85858f]">BROK is a fast, opinionated AI assistant with live web search. Ask anything, research something, or give it a goal.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {starterPrompts.map((prompt) => <button key={prompt} onClick={() => void sendMessage(prompt)} className="rounded-2xl border border-[#24242c] bg-[#0d0d11] p-4 text-left text-sm text-[#b5b5be] transition hover:border-[#44444e] hover:bg-[#111116]">{prompt}</button>)}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-7 pb-8">
            {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={message.role === 'user' ? 'max-w-[85%] rounded-3xl rounded-br-md bg-white px-5 py-3.5 text-sm leading-6 text-black' : 'max-w-[95%] whitespace-pre-wrap px-1 py-2 text-[15px] leading-7 text-[#e5e5ea]'}>{message.content}</div>
            </div>)}
            {loading && <div className="flex items-center gap-2 px-1 text-sm text-[#777782]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#b7ff3c]"/> Thinking + searching the web…</div>}
          </div>
        )}

        <form onSubmit={submit} className="sticky bottom-3 rounded-3xl border border-[#292930] bg-[#101014] p-2 shadow-2xl">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }} placeholder="Ask BROK anything…" rows={1} className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[#5f5f69]" />
            <button type="submit" disabled={!input.trim() || loading} className="h-12 w-12 rounded-2xl bg-white text-xl text-black transition hover:bg-[#ddd] disabled:cursor-not-allowed disabled:opacity-30">↑</button>
          </div>
          <div className="px-3 pb-1 pt-1 text-[10px] text-[#55555f]">BROK uses xAI server-side. Your API key never reaches the browser.</div>
        </form>
      </section>
    </main>
  )
}
