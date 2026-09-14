"use client"

import Link from 'next/link'
import { useState } from 'react'

type Evidence = { id: string; kind: string; summary: string; source: string }
type Run = { result: { status: 'PASS' | 'FAIL' | 'UNKNOWN'; checks: Array<{ name: string; passed: boolean; detail: string }>; evidence: Evidence[] }; plan: { actions: Array<{ id: string; tool: string; input: unknown; reason: string }> }; events: Array<{ type: string; actionId?: string; tool?: string; output?: unknown }> }

const examples = ['calculate 7 * 6', 'what is 128 / 4 + 3', 'what time is it', 'repeat this exact phrase']

export default function Console() {
  const [goal, setGoal] = useState('calculate 7 * 6')
  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function execute() {
    setLoading(true); setError(''); setRun(null)
    try {
      const response = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goal }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Run failed.')
      setRun(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Run failed.') }
    finally { setLoading(false) }
  }

  const status = run?.result.status
  const statusClass = status === 'PASS' ? 'text-[#b7ff3c]' : status === 'FAIL' ? 'text-[#ff7777]' : 'text-[#e5d36b]'

  return <main className="min-h-screen bg-[#070708] text-[#f5f5f7]">
    <header className="border-b border-[#202026]"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg border border-[#303035] text-[#b7ff3c]">◆</span><b>AEGIS</b></Link><span className="mono text-[10px] tracking-widest text-[#666670]">RUNTIME v0.1 · LOCAL</span></div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="mb-10"><p className="mono text-xs text-[#b7ff3c]">MISSION CONTROL</p><h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Give AEGIS a task.</h1><p className="mt-3 max-w-2xl text-[#85858f]">Plan → tool → observation → verification → evidence. The runtime, not the model, owns the final decision.</p></div>
      <section className="glow rounded-2xl border border-[#2b3420] bg-[#0d1109] p-5 md:p-6"><label className="mono text-[10px] tracking-widest text-[#777780]">TASK GOAL</label><textarea value={goal} onChange={e=>setGoal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))execute()}} rows={3} className="mt-3 w-full resize-none rounded-xl border border-[#303037] bg-[#09090b] p-4 text-base outline-none focus:border-[#b7ff3c]/50" placeholder="What should AEGIS do?"/><div className="mt-3 flex flex-wrap gap-2">{examples.map(example=><button key={example} onClick={()=>setGoal(example)} className="rounded-full border border-[#303037] px-3 py-1.5 text-xs text-[#92929c] hover:border-[#b7ff3c]/40 hover:text-white">{example}</button>)}</div><div className="mt-5 flex items-center justify-between gap-3"><span className="text-xs text-[#666670]">Ctrl/⌘ + Enter to execute</span><button onClick={execute} disabled={loading||!goal.trim()} className="rounded-xl bg-[#b7ff3c] px-6 py-3 text-sm font-semibold text-black disabled:opacity-40">{loading?'Executing…':'Run task →'}</button></div></section>
      {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
      {run && <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><div className="flex items-center justify-between"><div><p className="mono text-[10px] text-[#666670]">FINAL DECISION</p><p className={`mt-2 text-4xl font-semibold ${statusClass}`}>{status}</p></div><div className="text-right"><p className="mono text-[10px] text-[#666670]">EVIDENCE</p><p className="mt-2 text-2xl font-semibold">{run.result.evidence.length}</p></div></div></div><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><p className="mono text-[10px] text-[#666670]">EXECUTION TRACE</p><div className="mt-4 space-y-2">{run.events.map((event,i)=><div key={i} className="rounded-xl border border-[#202026] bg-[#09090b] p-4"><div className="flex items-center gap-3"><span className="mono text-[10px] text-[#b7ff3c]">{String(i+1).padStart(2,'0')}</span><b className="text-sm">{event.type.toUpperCase()}</b>{event.tool&&<span className="mono text-xs text-[#777780]">{event.tool}</span>}</div>{event.output!==undefined&&<pre className="mt-2 overflow-auto text-xs text-[#9b9ba5]">{JSON.stringify(event.output,null,2)}</pre>}</div>)}</div></div><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><p className="mono text-[10px] text-[#666670]">VERIFICATION</p><div className="mt-4 space-y-2">{run.result.checks.map(check=><div key={check.name} className="flex items-start justify-between gap-4 rounded-xl border border-[#202026] p-4"><div><b className="text-sm">{check.name}</b><p className="mt-1 text-xs text-[#777780]">{check.detail}</p></div><span className={check.passed?'text-[#b7ff3c]':'text-[#ff7777]'}>{check.passed?'PASS':'FAIL'}</span></div>)}</div></div></div><aside className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5 h-fit"><p className="mono text-[10px] text-[#666670]">EVIDENCE LEDGER</p><div className="mt-4 space-y-3">{run.result.evidence.map(item=><div key={item.id} className="border-l border-[#b7ff3c]/40 pl-3"><p className="text-xs font-medium">{item.summary}</p><p className="mt-1 mono text-[10px] text-[#666670]">{item.kind} · {item.source}</p></div>)}</div><div className="mt-6 rounded-xl border border-[#2b3420] bg-[#10140b] p-4 text-xs leading-5 text-[#8f8f99]">Tools and checks produce evidence. Model text alone cannot turn UNKNOWN into PASS.</div></aside></section>}
    </div>
  </main>
}
