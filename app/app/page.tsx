"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'

const demo = [
  {name:'Sunrise Dental Care',url:'sunrisedental.example',score:42,status:'Audited',issues:7},
  {name:'UrbanFit Studio',url:'urbanfit.example',score:58,status:'Preview Sent',issues:5},
  {name:'Mehta Interiors',url:'mehtainteriors.example',score:31,status:'New',issues:9},
]

export default function Dashboard(){
 const [url,setUrl]=useState(''); const [active,setActive]=useState('Overview'); const [created,setCreated]=useState(false)
 const stats=useMemo(()=>({audits:created?4:3,previews:created?2:1,leads:created?1:0}),[created])
 const create=()=>{if(url.trim())setCreated(true)}
 return <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
  <header className="border-b border-[#202026] bg-[#08080a]/90"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg border border-[#303035] text-[#b7ff3c]">◉</div><b>LeadGhost</b></Link><div className="flex items-center gap-3"><span className="hidden text-xs text-[#777780] sm:block">Free plan · 3 / 3 audits</span><button className="rounded-lg border border-[#303035] px-3 py-2 text-xs">Upgrade</button></div></div></header>
  <div className="mx-auto grid max-w-7xl md:grid-cols-[210px_1fr]"><aside className="hidden min-h-[calc(100vh-65px)] border-r border-[#202026] p-4 md:block">{['Overview','Audits','Prospects','Previews','Billing','Settings'].map(x=><button onClick={()=>setActive(x)} key={x} className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm ${active===x?'bg-[#171a12] text-[#b7ff3c]':'text-[#85858f] hover:bg-white/5'}`}>{x}</button>)}</aside>
  <main className="p-5 md:p-8"><div className="mb-8"><p className="mono text-xs text-[#b7ff3c]">{active.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{active==='Overview'?'Your sales cockpit':active}</h1><p className="mt-2 text-sm text-[#85858f]">Find the next business worth pitching.</p></div>
   <section className="glow rounded-2xl border border-[#2b3420] bg-[#0d1109] p-5 md:p-6"><div className="mb-4"><h2 className="font-semibold">Analyze a prospect</h2><p className="mt-1 text-xs text-[#777780]">Paste a public business website. LeadGhost will build the audit and sales preview.</p></div><div className="flex flex-col gap-3 sm:flex-row"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example-business.com" className="min-w-0 flex-1 rounded-xl border border-[#333339] bg-[#09090b] px-4 py-3 text-sm outline-none focus:border-[#b7ff3c]/50"/><button onClick={create} className="rounded-xl bg-[#b7ff3c] px-5 py-3 text-sm font-semibold text-black">{created?'Audit created ✓':'Create audit →'}</button></div></section>
   <div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Audits this month',stats.audits+'/3'],['Previews created',stats.previews],['New leads',stats.leads]].map(([a,b])=><div key={a} className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-5"><p className="text-xs text-[#777780]">{a}</p><p className="mt-3 text-2xl font-semibold">{b}</p></div>)}</div>
   <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent prospects</h2><button className="text-xs text-[#b7ff3c]">View all →</button></div><div className="overflow-hidden rounded-2xl border border-[#24242b] bg-[#0c0c0f]">{demo.map((p,i)=><div key={p.name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#202026] p-5 last:border-0 md:grid-cols-[1fr_100px_120px_90px]"><div><p className="text-sm font-medium">{p.name}{i===0&&created?<span className="ml-2 rounded bg-[#b7ff3c]/10 px-2 py-1 text-[10px] text-[#b7ff3c]">NEW</span>:null}</p><p className="mt-1 text-xs text-[#676771]">{p.url}</p></div><div className="hidden text-sm md:block"><span className={p.score<45?'text-[#ff7070]':'text-[#e5d36b]'}>{p.score}/100</span></div><div className="hidden text-xs text-[#85858f] md:block">{p.issues} issues</div><div className="text-right text-xs text-[#b7ff3c]">{p.status}</div></div>)}</div></section>
  </main></div></div>
}