import { NextResponse } from 'next/server'

function scoreSite(html: string) {
  const text = html.toLowerCase()
  const checks = [
    { key: 'title', label: 'Page title', ok: /<title[^>]*>\s*[^<]{3,}\s*<\/title>/.test(text), fix: 'Add a specific title describing the business and service.' },
    { key: 'description', label: 'Meta description', ok: /name=["']description["']/.test(text), fix: 'Add a concise benefit-led meta description.' },
    { key: 'viewport', label: 'Mobile viewport', ok: /name=["']viewport["']/.test(text), fix: 'Add a responsive viewport declaration.' },
    { key: 'h1', label: 'Primary headline', ok: /<h1\b[^>]*>[^<]{3,}/.test(text), fix: 'Give visitors one clear, benefit-led primary headline.' },
    { key: 'cta', label: 'Conversion CTA', ok: /(book|call|contact|get started|request|buy|quote|schedule|enquire|inquire)/.test(text), fix: 'Add a prominent action visitors can take immediately.' },
    { key: 'https', label: 'HTTPS', ok: true, fix: '' },
    { key: 'images', label: 'Image accessibility', ok: !/<img\b(?![^>]*\balt=)/.test(text), fix: 'Add useful alt text to meaningful images.' },
  ]
  const passed = checks.filter(c => c.ok).length
  const score = Math.round((passed / checks.length) * 100)
  return { score, checks }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'A website URL is required.' }, { status: 400 })
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported URL')
    const response = await fetch(parsed.toString(), { headers: { 'User-Agent': 'LeadGhost-Audit/0.1 (+website audit)' }, signal: AbortSignal.timeout(10000), cache: 'no-store' })
    if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`)
    const html = (await response.text()).slice(0, 800000)
    const result = scoreSite(html)
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || parsed.hostname
    return NextResponse.json({ url: parsed.toString(), title, score: result.score, checks: result.checks, note: 'Score is a heuristic based on publicly accessible HTML, not a measured performance score.' })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to analyze this website.' }, { status: 422 })
  }
}
