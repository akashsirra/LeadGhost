import { NextResponse } from 'next/server'

function analyze(html: string) {
  const text = html.toLowerCase()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || ''
  const viewport = /name=["']viewport["']/i.test(html)
  const h1 = (html.match(/<h1\b/gi) || []).length
  const cta = (html.match(/<(a|button)\b/gi) || []).length
  const images = (html.match(/<img\b/gi) || []).length
  const altImages = (html.match(/<img\b[^>]*\balt=["'][^"']*["']/gi) || []).length
  const checks = [
    { key:'title', label:'Page title', ok:!!title, evidence:title || 'No title detected', fix:'Add a specific title describing the business and primary service.' },
    { key:'description', label:'Meta description', ok:!!description, evidence:description || 'No meta description detected', fix:'Add a concise benefit-led description.' },
    { key:'viewport', label:'Mobile viewport', ok:viewport, evidence:viewport?'Viewport detected':'No standard viewport detected', fix:'Add responsive viewport configuration.' },
    { key:'h1', label:'Primary headline', ok:h1===1, evidence:`${h1} H1 element(s) detected`, fix:'Use one clear, benefit-led primary headline.' },
    { key:'cta', label:'Action elements', ok:cta>0, evidence:`${cta} links/buttons detected`, fix:'Give visitors one obvious action: call, WhatsApp, book, quote, or contact.' },
    { key:'images', label:'Image accessibility', ok:images===0 || altImages/images>=0.75, evidence:images?`${altImages}/${images} images include alt text`:'No images detected', fix:'Add useful alt text to meaningful images.' },
    { key:'https', label:'HTTPS', ok:true, evidence:'Transport security depends on the requested URL and deployment.', fix:'Keep the production site on HTTPS.' },
  ]
  const score=Math.round(checks.filter(c=>c.ok).length/checks.length*100)
  return {score,checks,facts:{title:title||null,description:description||null,viewport,h1,actionElements:cta,images,imagesWithAlt:altImages}}
}

export async function POST(req:Request){
  try{
    const {url}=await req.json(); if(!url||typeof url!=='string') return NextResponse.json({error:'A website URL is required.'},{status:400})
    const normalized=/^https?:\/\//i.test(url)?url:`https://${url}`; const parsed=new URL(normalized)
    if(!['http:','https:'].includes(parsed.protocol)) throw new Error('Unsupported URL')
    const response=await fetch(parsed.toString(),{headers:{'User-Agent':'LeadGhost-Audit/0.2 (+website audit)'},signal:AbortSignal.timeout(12000),cache:'no-store',redirect:'follow'})
    if(!response.ok) throw new Error(`Website returned HTTP ${response.status}`)
    const html=(await response.text()).slice(0,1500000); const result=analyze(html)
    return NextResponse.json({ok:true,url:response.url,hostname:new URL(response.url).hostname,...result,note:'This is a heuristic audit of publicly accessible HTML. It does not claim measured Core Web Vitals, traffic, rankings, or revenue impact.'})
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Unable to analyze this website.'},{status:422})}
}
