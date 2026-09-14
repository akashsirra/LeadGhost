"use client"

import Link from 'next/link'
import { useState } from 'react'

type Evidence = { id?: string; kind: string; summary: string; source: string }
type Run = { result: { status: 'PASS' | 'FAIL' | 'UNKNOWN'; checks: Array<{ name: string; passed: boolean; detail: string }>; evidence: Evidence[] }; plan: { actions: Array<{ id: string; tool: string; input: unknown; reason: string }> }; events: Array<{ type: string; actionId?: string; tool?: string; output?: unknown }> }
type Proposal = { patch: { path: string; before: string; after: string }; approval: { id: string; summary: string; paths: string[] }; evidence: Evidence[] }
type RemoteFile = { path: string; sha: string; content: string }

const examples = ['audit this repository', 'list files in core', 'read file core/runtime.ts', 'git status', 'git diff', 'git log', 'calculate 7 * 6']

export default function Console() {
  const [goal, setGoal] = useState('audit this repository')
  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [path, setPath] = useState('README.md')
  const [replacement, setReplacement] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [engineeringStatus, setEngineeringStatus] = useState('')
  const [engineeringBusy, setEngineeringBusy] = useState(false)
  const [repository, setRepository] = useState('akashsirra/LeadGhost')
  const [remotePath, setRemotePath] = useState('README.md')
  const [remote, setRemote] = useState<RemoteFile | null>(null)
  const [remoteStatus, setRemoteStatus] = useState('')

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

  async function propose() {
    setEngineeringBusy(true); setEngineeringStatus(''); setProposal(null)
    try {
      const response = await fetch('/api/engineering', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'propose', path, after: replacement }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Proposal failed.')
      setProposal(data); setEngineeringStatus('Proposal ready. Nothing has been written.')
    } catch (e) { setEngineeringStatus(e instanceof Error ? e.message : 'Proposal failed.') }
    finally { setEngineeringBusy(false) }
  }

  async function approveAndApply() {
    if (!proposal) return
    setEngineeringBusy(true); setEngineeringStatus('Applying approved change and running verification…')
    try {
      const response = await fetch('/api/engineering', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'apply', approved: true, patch: proposal.patch }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Apply failed.')
      setEngineeringStatus(`${data.status}: change applied, then typecheck + tests + build were executed.`)
    } catch (e) { setEngineeringStatus(e instanceof Error ? e.message : 'Apply failed.') }
    finally { setEngineeringBusy(false) }
  }

  async function inspectRemote() {
    setRemoteStatus('Reading repository…'); setRemote(null)
    try {
      const response = await fetch('/api/github', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'read', repository, path: remotePath }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'GitHub read failed.')
      setRemote(data.file); setRemoteStatus(`Read ${data.file.path} at ${data.file.sha.slice(0, 8)}.`)
    } catch (e) { setRemoteStatus(e instanceof Error ? e.message : 'GitHub read failed.') }
  }

  async function approveRemoteBranch() {
    if (!remote) return
    setRemoteStatus('Creating approved branch change…')
    try {
      const response = await fetch('/api/github', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'apply', approved: true, repository, path: remote.path, expectedSha: remote.sha, content: replacement || remote.content, message: 'feat: apply approved aegis change' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'GitHub write failed.')
      setRemoteStatus(`Approved change committed to ${data.branch}. Commit ${data.commitSha.slice(0, 8)}.`)
    } catch (e) { setRemoteStatus(e instanceof Error ? e.message : 'GitHub write failed.') }
  }

  const status = run?.result.status
  const statusClass = status === 'PASS' ? 'text-[#b7ff3c]' : status === 'FAIL' ? 'text-[#ff7777]' : 'text-[#e5d36b]'

  return <main className="min-h-screen bg-[#070708] text-[#f5f5f7]">
    <header className="border-b border-[#202026]"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg border border-[#303035] text-[#b7ff3c]">◆</span><b>AEGIS</b></Link><span className="mono text-[10px] tracking-widest text-[#666670]">MISSION CONTROL · v1.0 PREVIEW</span></div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="mb-10"><p className="mono text-xs text-[#b7ff3c]">AUTONOMOUS ENGINEERING</p><h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Give AEGIS a mission.</h1><p className="mt-3 max-w-3xl text-[#85858f]">Inspect → propose → approve → change → test → build → verify. AEGIS never treats model text as proof.</p></div>

      <section className="glow rounded-2xl border border-[#2b3420] bg-[#0d1109] p-5 md:p-6"><label className="mono text-[10px] tracking-widest text-[#777780]">MISSION GOAL</label><textarea value={goal} onChange={e=>setGoal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))execute()}} rows={3} className="mt-3 w-full resize-none rounded-xl border border-[#303037] bg-[#09090b] p-4 text-base outline-none focus:border-[#b7ff3c]/50" placeholder="What should AEGIS do?"/><div className="mt-3 flex flex-wrap gap-2">{examples.map(example=><button key={example} onClick={()=>setGoal(example)} className="rounded-full border border-[#303037] px-3 py-1.5 text-xs text-[#92929c] hover:border-[#b7ff3c]/40 hover:text-white">{example}</button>)}</div><div className="mt-5 flex items-center justify-between gap-3"><span className="text-xs text-[#666670]">Read-only missions are autonomous.</span><button onClick={execute} disabled={loading||!goal.trim()} className="rounded-xl bg-[#b7ff3c] px-6 py-3 text-sm font-semibold text-black disabled:opacity-40">{loading?'Executing…':'Run mission →'}</button></div></section>

      <section className="mt-6 rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="mono text-[10px] tracking-widest text-[#b7ff3c]">REMOTE REPOSITORY</p><h2 className="mt-2 text-xl font-semibold">Inspect a GitHub file</h2><p className="mt-1 text-sm text-[#777780]">Public repositories can be read without a token. Approved writes require a server-side GITHUB_TOKEN and always create a branch.</p></div><span className="rounded-full border border-[#303037] px-3 py-1 text-[10px] text-[#777780]">BRANCH ONLY</span></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_auto]"><input value={repository} onChange={e=>setRepository(e.target.value)} className="rounded-xl border border-[#303037] bg-[#09090b] px-4 py-3 text-sm outline-none" placeholder="owner/repository"/><input value={remotePath} onChange={e=>setRemotePath(e.target.value)} className="rounded-xl border border-[#303037] bg-[#09090b] px-4 py-3 text-sm outline-none" placeholder="README.md"/><button onClick={inspectRemote} className="rounded-xl border border-[#b7ff3c]/40 px-5 py-3 text-sm font-semibold text-[#b7ff3c]">Inspect</button></div>{remoteStatus&&<p className="mt-3 text-xs text-[#888891]">{remoteStatus}</p>}{remote&&<div className="mt-4 rounded-xl border border-[#202026] bg-[#09090b] p-4"><div className="flex items-center justify-between gap-3"><span className="mono text-[10px] text-[#666670]">REMOTE EVIDENCE · {remote.sha.slice(0,8)}</span><button onClick={approveRemoteBranch} className="rounded-lg bg-[#b7ff3c] px-4 py-2 text-xs font-semibold text-black">Approve branch change</button></div><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-[#9b9ba5]">{remote.content}</pre></div>}</section>

      <section className="mt-6 rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="mono text-[10px] tracking-widest text-[#b7ff3c]">CONTROLLED CHANGE</p><h2 className="mt-2 text-xl font-semibold">Propose a local file change</h2><p className="mt-1 text-sm text-[#777780]">Nothing is written during proposal. Applying requires explicit approval and automatically runs typecheck, tests and build.</p></div><span className="rounded-full border border-[#303037] px-3 py-1 text-[10px] text-[#777780]">APPROVAL GATE</span></div><div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]"><input value={path} onChange={e=>setPath(e.target.value)} className="rounded-xl border border-[#303037] bg-[#09090b] px-4 py-3 text-sm outline-none" placeholder="README.md"/><textarea value={replacement} onChange={e=>setReplacement(e.target.value)} rows={5} className="rounded-xl border border-[#303037] bg-[#09090b] p-4 font-mono text-xs outline-none" placeholder="Complete replacement file content…"/></div><div className="mt-4 flex flex-wrap gap-3"><button onClick={propose} disabled={engineeringBusy||!path.trim()||!replacement} className="rounded-xl border border-[#b7ff3c]/40 px-5 py-3 text-sm font-semibold text-[#b7ff3c] disabled:opacity-40">{engineeringBusy?'Working…':'Create proposal'}</button>{proposal&&<button onClick={approveAndApply} disabled={engineeringBusy} className="rounded-xl bg-[#b7ff3c] px-5 py-3 text-sm font-semibold text-black disabled:opacity-40">Approve + apply →</button>}</div>{engineeringStatus&&<p className="mt-4 text-sm text-[#9b9ba5]">{engineeringStatus}</p>}{proposal&&<div className="mt-5 rounded-xl border border-[#2b3420] bg-[#10140b] p-4"><p className="mono text-[10px] text-[#666670]">PROPOSAL</p><p className="mt-2 text-sm">{proposal.approval.summary}</p><p className="mt-2 mono text-[10px] text-[#777780]">{proposal.patch.path} · bounded replacement · stale-file protection enabled</p></div>}</section>

      {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
      {run && <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><div className="flex items-center justify-between"><div><p className="mono text-[10px] text-[#666670]">FINAL DECISION</p><p className={`mt-2 text-4xl font-semibold ${statusClass}`}>{status}</p></div><div className="text-right"><p className="mono text-[10px] text-[#666670]">EVIDENCE</p><p className="mt-2 text-2xl font-semibold">{run.result.evidence.length}</p></div></div></div><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><p className="mono text-[10px] text-[#666670]">EXECUTION TRACE</p><div className="mt-4 space-y-2">{run.events.map((event,i)=><div key={i} className="rounded-xl border border-[#202026] bg-[#09090b] p-4"><div className="flex items-center gap-3"><span className="mono text-[10px] text-[#b7ff3c]">{String(i+1).padStart(2,'0')}</span><b className="text-sm">{event.type.toUpperCase()}</b>{event.tool&&<span className="mono text-xs text-[#777780]">{event.tool}</span>}</div>{event.output!==undefined&&<pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-[#9b9ba5]">{JSON.stringify(event.output,null,2)}</pre>}</div>)}</div></div><div className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><p className="mono text-[10px] text-[#666670]">VERIFICATION</p><div className="mt-4 space-y-2">{run.result.checks.map(check=><div key={check.name} className="flex items-start justify-between gap-4 rounded-xl border border-[#202026] p-4"><div><b className="text-sm">{check.name}</b><p className="mt-1 text-xs text-[#777780]">{check.detail}</p></div><span className={check.passed?'text-[#b7ff3c]':'text-[#ff7777]'}>{check.passed?'PASS':'FAIL'}</span></div>)}</div></div></div><aside className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5 h-fit"><p className="mono text-[10px] text-[#666670]">EVIDENCE LEDGER</p><div className="mt-4 space-y-3">{run.result.evidence.map(item=><div key={item.id ?? item.source} className="border-l border-[#b7ff3c]/40 pl-3"><p className="text-xs font-medium">{item.summary}</p><p className="mt-1 mono text-[10px] text-[#666670]">{item.kind} · {item.source}</p></div>)}</div><div className="mt-6 rounded-xl border border-[#2b3420] bg-[#10140b] p-4 text-xs leading-5 text-[#8f8f99]">Model output can propose work. Runtime permissions and deterministic verification decide what AEGIS is allowed to trust.</div></aside></section>}
    </div>
  </main>
}
