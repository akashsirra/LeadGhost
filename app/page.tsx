import Link from 'next/link'

const problems = [
  ['01','First impression','Visitors decide whether a business feels trustworthy in seconds.'],
  ['02','Conversion leaks','Weak calls-to-action and unclear offers make ready-to-buy visitors hesitate.'],
  ['03','Mobile friction','A site that fights the phone loses the moment most local customers arrive.'],
]

export default function Home() {
  return <main className="min-h-screen overflow-hidden">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg border border-[#303035] bg-[#111116] text-[#b7ff3c]">◉</div><span className="text-lg font-semibold tracking-tight">LeadGhost</span></div>
      <div className="hidden gap-7 text-sm text-[#9999a3] md:flex"><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#why">Why LeadGhost</a></div>
      <Link href="/app" className="rounded-full border border-[#333339] px-4 py-2 text-sm hover:bg-white/5">Open app →</Link>
    </nav>

    <section className="grid-bg relative mx-auto max-w-6xl px-5 pb-24 pt-16 text-center md:px-8 md:pt-28">
      <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#2c3420] bg-[#10140b] px-3 py-1.5 text-xs text-[#b7ff3c] mono"><span className="h-1.5 w-1.5 rounded-full bg-[#b7ff3c]"/> SALES TOOL FOR WEB FREELANCERS</div>
      <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-.05em] md:text-7xl">Find websites that are<br/><span className="text-[#b7ff3c]">losing customers.</span><br/>Show them what they could have.</h1>
      <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#9a9aa4] md:text-lg">Turn a business URL into a persuasive audit, an original redesign preview, and a qualified website lead — in minutes.</p>
      <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"><Link href="/app" className="glow flex-1 rounded-xl bg-[#b7ff3c] px-6 py-4 font-semibold text-black hover:brightness-105">Analyze a website →</Link><a href="#how" className="flex-1 rounded-xl border border-[#303037] px-6 py-4 font-medium text-white hover:bg-white/5">See how it works</a></div>
      <p className="mt-4 text-xs text-[#666670]">No fake metrics. No invented testimonials. Evidence first.</p>
    </section>

    <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:px-8"><div className="mb-12 flex items-end justify-between"><div><p className="mono text-xs text-[#b7ff3c]">THE MONEY LOOP</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Audit. Visualize. Close.</h2></div><span className="hidden text-sm text-[#666670] md:block">Prospect → Preview → Project</span></div><div className="grid gap-4 md:grid-cols-3">{problems.map(([n,t,d])=><div key={n} className="rounded-2xl border border-[#24242b] bg-[#0c0c0f] p-7"><span className="mono text-xs text-[#676771]">{n}</span><h3 className="mt-12 text-xl font-semibold">{t}</h3><p className="mt-3 text-sm leading-6 text-[#8e8e99]">{d}</p></div>)}</div></section>

    <section id="why" className="border-y border-[#202026] bg-[#0a0a0d]"><div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:px-8"><div><p className="mono text-xs text-[#b7ff3c]">BUILT TO SELL</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">The audit isn't the product.<br/>The <span className="text-[#b7ff3c]">website sale</span> is.</h2></div><div className="space-y-4 text-sm leading-7 text-[#9999a3]"><p>LeadGhost gives freelancers a reason to contact a prospect with something genuinely useful: a diagnosis and a visual direction for their business.</p><p>Every report ends with a natural next step — request the redesign. Every request becomes a prospect you can manage and close.</p></div></div></section>

    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 md:px-8"><div className="text-center"><p className="mono text-xs text-[#b7ff3c]">SIMPLE PRICING</p><h2 className="mt-3 text-3xl font-semibold">Start free. Upgrade when it pays.</h2></div><div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">{[['Free','₹0','3 audits / month','Branded previews'],['Solo','₹999','Higher limits','Remove branding'],['Agency','₹2,999','Team-ready','Higher limits']].map(([name,price,a,b],i)=><div key={name} className={`rounded-2xl border p-6 ${i===1?'border-[#b7ff3c]/40 bg-[#10140b]':'border-[#24242b] bg-[#0c0c0f]'}`}><div className="text-sm text-[#9999a3]">{name}</div><div className="mt-4 text-3xl font-semibold">{price}<span className="text-sm text-[#777780]">{price==='₹0'?'':' /mo'}</span></div><div className="mt-6 border-t border-[#24242b] pt-5 text-sm text-[#aaaab3]">{a}<br/><br/>{b}</div></div>)}</div></section>

    <footer className="border-t border-[#202026] px-5 py-8 text-center text-xs text-[#666670]">LeadGhost © 2026 · Built for people who sell websites.</footer>
  </main>
}