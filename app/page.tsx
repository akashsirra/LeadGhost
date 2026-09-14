import Link from 'next/link'

const pillars = [
  ['01', 'Evidence first', 'A model claim is never proof. AEGIS records observable evidence for important decisions.'],
  ['02', 'Verify before trust', 'Tasks finish only after deterministic checks produce PASS, FAIL, or UNKNOWN.'],
  ['03', 'Learn from failure', 'Recurring agent mistakes become skills, evaluations, or hard constraints.'],
]

export default function Home() {
  return <main className="min-h-screen overflow-hidden">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg border border-[#303035] bg-[#111116] text-[#b7ff3c]">◆</div><span className="text-lg font-semibold tracking-tight">AEGIS</span></div>
      <Link href="/app" className="rounded-full border border-[#333339] px-4 py-2 text-sm hover:bg-white/5">Open console →</Link>
    </nav>

    <section className="grid-bg mx-auto max-w-6xl px-5 pb-24 pt-16 text-center md:px-8 md:pt-28">
      <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#2c3420] bg-[#10140b] px-3 py-1.5 text-xs text-[#b7ff3c] mono"><span className="h-1.5 w-1.5 rounded-full bg-[#b7ff3c]"/> AUTONOMOUS ENGINEERING SYSTEM</div>
      <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-.05em] md:text-7xl">Make agents<br/><span className="text-[#b7ff3c]">trustworthy.</span></h1>
      <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#9a9aa4] md:text-lg">AEGIS coordinates agents, tools, skills, evaluations, and verification so autonomous engineering becomes an evidence-backed process instead of a leap of faith.</p>
      <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"><Link href="/app" className="glow flex-1 rounded-xl bg-[#b7ff3c] px-6 py-4 font-semibold text-black">Enter AEGIS →</Link><a href="#how" className="flex-1 rounded-xl border border-[#303037] px-6 py-4 font-medium">See the architecture</a></div>
      <p className="mt-4 text-xs text-[#666670]">Unknown is not pass. Claims are not evidence.</p>
    </section>

    <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:px-8"><div className="mb-12"><p className="mono text-xs text-[#b7ff3c]">THE TRUST LOOP</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Goal → Execute → Verify → Evidence</h2></div><div className="grid gap-4 md:grid-cols-3">{pillars.map(([n,t,d])=><div key={n} className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-7"><span className="mono text-xs text-[#676771]">{n}</span><h3 className="mt-12 text-xl font-semibold">{t}</h3><p className="mt-3 text-sm leading-6 text-[#8e8e99]">{d}</p></div>)}</div></section>

    <section className="border-y border-[#202026] bg-[#0a0a0d]"><div className="mx-auto max-w-6xl px-5 py-20 md:px-8"><p className="mono text-xs text-[#b7ff3c]">TRUST LADDER</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['One local agent','Deterministic verification','Skills + evaluations','Specialized agent team','Hard constraints + CI','Cloud execution','Autonomous PRs','Continuous improvement'].map((x,i)=><div key={x} className="rounded-xl border border-[#24242b] bg-[#0d0d10] p-4"><span className="mono text-[10px] text-[#666670]">0{i+1}</span><p className="mt-3 text-sm">{x}</p></div>)}</div></div></section>

    <footer className="border-t border-[#202026] px-5 py-8 text-center text-xs text-[#666670]">AEGIS · Autonomous Engineering & Intelligence System · 2026</footer>
  </main>
}