'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useScroll } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { Eyebrow, RevealWords } from '../ui/Reveal'

const ease = [0.16, 1, 0.3, 1] as const

function CountUp({ to, decimals = 0, duration = 2 }: { to: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setV })
    return () => c.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref} className="tabular-nums">
      {v.toFixed(decimals)}
    </span>
  )
}

function Cell({ children, className = '', label, index }: { children: React.ReactNode; className?: string; label: string; index: string }) {
  return (
    <div className={`relative overflow-hidden bg-ink p-5 md:p-8 ${className}`}>
      {/* corner crosshairs */}
      <span aria-hidden className="absolute left-2 top-2 h-2 w-2 border-l border-t border-white/25" />
      <span aria-hidden className="absolute bottom-2 right-2 h-2 w-2 border-b border-r border-white/25" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 1.1, ease }}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="mono-label text-white/50">{label}</span>
          <span className="font-mono text-[0.62rem] text-white/25">{index}</span>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

/* ——— Field of view gauge (scroll-scrubbed) ——— */
function FovGauge() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'center 45%'] })
  const sweep = useRange(scrollYProgress, [0, 1], [0, 1])
  const fillO = useRange(scrollYProgress, [0.4, 1], [0, 0.5])
  const cx = 300, cy = 300, r = 250
  const pt = (deg: number, rr = r) => {
    const a = ((180 - deg) * Math.PI) / 180
    return [Math.round((cx + Math.cos(a) * rr) * 100) / 100, Math.round((cy - Math.sin(a) * rr) * 100) / 100]
  }
  const arc = (from: number, to: number, rr = r) => {
    const [x1, y1] = pt(from, rr)
    const [x2, y2] = pt(to, rr)
    return `M${x1} ${y1} A${rr} ${rr} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
  }
  const ours = [35, 145]
  const theirs = [45, 135]
  const [wx1, wy1] = pt(ours[0])
  const [wx2, wy2] = pt(ours[1])
  return (
    <div ref={ref}>
      <svg viewBox="0 0 600 330" className="mx-auto w-full max-w-[560px] overflow-visible" aria-label="Field of view: 110 degrees, compared with 90 degrees for a typical headset">
        <defs>
          <radialGradient id="fov-fill" cx="50%" cy="100%" r="80%">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 37 }).map((_, i) => {
          const deg = i * 5
          const [x1, y1] = pt(deg, r + 12)
          const [x2, y2] = pt(deg, r + (i % 2 ? 20 : 28))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.25)" strokeWidth={i % 2 ? 0.6 : 1} />
        })}
        <path d={arc(0, 180)} fill="none" stroke="rgba(255,255,255,.08)" />
        <motion.path d={`M${cx} ${cy} L${wx1} ${wy1} A${r} ${r} 0 0 1 ${wx2} ${wy2} Z`} fill="url(#fov-fill)" style={{ opacity: fillO }} />
        <path d={arc(theirs[0], theirs[1], r * 0.72)} fill="none" stroke="rgba(255,255,255,.4)" strokeDasharray="3 6" strokeWidth="1.5" />
        <motion.path d={arc(ours[0], ours[1])} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" style={{ pathLength: sweep }} />
        <line x1={cx} y1={cy} x2={wx1} y2={wy1} stroke="rgba(255,255,255,.2)" />
        <line x1={cx} y1={cy} x2={wx2} y2={wy2} stroke="rgba(255,255,255,.2)" />
        <text x={pt(90, r * 0.72)[0]} y={pt(90, r * 0.72)[1] - 10} textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="2">
          TYPICAL 90°
        </text>
      </svg>
      <div className="-mt-[14%] flex flex-col items-center">
        <span className="text-[clamp(3rem,6vw,5.5rem)] font-[200] leading-none tracking-[-0.04em]">
          <CountUp to={110} />°
        </span>
        <span className="mono-label mt-2 text-white/45">Horizontal field of view</span>
      </div>
    </div>
  )
}

/* ——— Latency bars ——— */
function Latency() {
  const rows = [
    { name: 'AETHER ONE', v: 8, ours: true },
    { name: 'Typical headset', v: 22 },
    { name: 'Phone-based AR', v: 46 },
  ]
  const max = 50
  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className={`text-[0.9rem] ${r.ours ? '' : 'text-white/55'}`}>{r.name}</span>
              <span className={`font-mono text-[0.85rem] ${r.ours ? 'text-accent' : 'text-white/45'}`}>{r.v} ms</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${r.ours ? 'bg-accent' : 'bg-white/30'}`}
                style={r.ours ? { boxShadow: '0 0 20px var(--accent)' } : undefined}
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.v / max) * 100}%` }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 1.6, ease, delay: 0.2 + i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-[-12px] border-l border-dashed border-white/35" style={{ left: `${(13 / max) * 100}%` }}>
        <span className="mono-label absolute -top-6 left-2 whitespace-nowrap text-[0.58rem] text-white/45">Perception ≈ 13 ms</span>
      </div>
      <p className="mt-10 text-[clamp(2.6rem,5vw,4.4rem)] font-[200] leading-none tracking-[-0.04em]">
        <CountUp to={8} />
        <span className="text-accent">ms</span>
      </p>
      <p className="mono-label mt-2 text-white/45">Motion-to-photon latency</p>
    </div>
  )
}

/* ——— Silicon die ——— */
function Silicon() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const N = 10
  return (
    <div ref={ref} className="flex flex-col gap-8 sm:flex-row sm:items-center">
      <div className="relative aspect-square w-full max-w-[220px] shrink-0 rounded-xl border border-white/15 p-3" style={{ background: 'linear-gradient(135deg,#15161b,#0a0a0d)' }}>
        <div className="grid h-full w-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: N * N }).map((_, i) => {
            const x = i % N
            const y = Math.floor(i / N)
            const r2 = x >= 3 && x <= 6 && y >= 3 && y <= 6
            const d = Math.hypot(x - 4.5, y - 4.5)
            return (
              <span
                key={i}
                className={`rounded-[2px] ${r2 ? 'bg-white' : 'bg-accent'}`}
                style={{ opacity: 0.12, animation: inView ? `core 2.4s ease-in-out ${d * 0.16}s infinite` : undefined }}
              />
            )
          })}
        </div>
        <span className="mono-label absolute -bottom-6 left-0 text-[0.58rem] text-white/35">Æ1 + R2 · 3 nm</span>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5">
        {[
          ['48', 'TOPS neural'],
          ['16', 'CPU cores'],
          ['3', 'nm process'],
          ['256', 'GB/s memory'],
        ].map(([k, l]) => (
          <div key={l}>
            <dt className="text-[clamp(1.8rem,3vw,2.6rem)] font-[200] leading-none">
              <CountUp to={parseFloat(k)} />
            </dt>
            <dd className="mono-label mt-2 text-white/45">{l}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ——— Sustained performance chart with crosshair ——— */
const W = 600, H = 240
const oursAt = (m: number) => 97 + Math.sin(m / 18) * 1.2
const theirsAt = (m: number) => (m < 25 ? 100 - m * 0.2 : 95 - 33 * (1 - Math.exp(-(m - 25) / 28)))
const toXY = (m: number, v: number) => [(m / 180) * W, H - ((v - 40) / 65) * H]
const pathOf = (fn: (m: number) => number) =>
  Array.from({ length: 61 }, (_, i) => {
    const m = i * 3
    const [x, y] = toXY(m, fn(m))
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

function Performance() {
  const [hover, setHover] = useState<number | null>(null)
  const ours = pathOf(oursAt)
  const theirs = pathOf(theirsAt)
  const m = hover ?? 120
  const [hx, hy] = toXY(m, oursAt(m))
  const [, ty] = toXY(m, theirsAt(m))
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-5">
        <span className="flex items-center gap-2 text-[0.8rem]"><span className="h-0.5 w-5 bg-accent" />AETHER ONE</span>
        <span className="flex items-center gap-2 text-[0.8rem] text-white/50"><span className="h-0 w-5 border-t border-dashed border-white/50" />Typical headset</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="w-full touch-pan-y overflow-visible"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setHover(Math.max(0, Math.min(180, ((e.clientX - r.left) / r.width) * 180)))
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Sustained performance over three hours: AETHER ONE holds around 97 percent while a typical headset throttles to about 62 percent."
      >
        <defs>
          <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 60, 120, 180].map((t) => (
          <g key={t}>
            <line x1={(t / 180) * W} x2={(t / 180) * W} y1={0} y2={H} stroke="rgba(255,255,255,.06)" />
            <text x={(t / 180) * W} y={H + 18} fill="rgba(255,255,255,.35)" fontSize="10" fontFamily="var(--font-mono)" textAnchor={t === 180 ? 'end' : t ? 'middle' : 'start'}>
              {t} MIN
            </text>
          </g>
        ))}
        <motion.path
          d={`${ours} L${W} ${H} L0 ${H} Z`}
          fill="url(#perf-area)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />
        <motion.path d={theirs} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" strokeDasharray="4 5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, ease }} />
        <motion.path d={ours} fill="none" stroke="var(--accent)" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, ease, delay: 0.2 }} />
        <line x1={hx} x2={hx} y1={0} y2={H} stroke="rgba(255,255,255,.3)" />
        <circle cx={hx} cy={hy} r="5" fill="var(--accent)" />
        <circle cx={hx} cy={ty} r="4" fill="#050507" stroke="rgba(255,255,255,.6)" />
        <g transform={`translate(${Math.min(hx + 10, W - 130)} ${Math.max(hy - 40, 4)})`}>
          <rect width="120" height="44" rx="8" fill="rgba(20,20,26,.92)" stroke="rgba(255,255,255,.12)" />
          <text x="10" y="18" fill="#fff" fontSize="11" fontFamily="var(--font-mono)">{Math.round(oursAt(m))}% · {Math.round(m)} min</text>
          <text x="10" y="34" fill="rgba(255,255,255,.5)" fontSize="11" fontFamily="var(--font-mono)">vs {Math.round(theirsAt(m))}%</text>
        </g>
      </svg>
    </div>
  )
}

/* ——— Pixel density loupes ——— */
function Loupe({ ppd, label, ours }: { ppd: number; label: string; ours?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const size = 180
    c.width = c.height = size * 2
    const draw = (res: number) => {
      const r = Math.max(3, Math.round(res))
      const off = document.createElement('canvas')
      off.width = off.height = r
      const o = off.getContext('2d')!
      o.fillStyle = '#050507'
      o.fillRect(0, 0, r, r)
      o.fillStyle = '#ffffff'
      o.font = `300 ${r * 0.78}px 'Inter Tight Variable', sans-serif`
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      o.fillText('Æ', r / 2, r * 0.54)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(off, 0, 0, c.width, c.height)
      if (r < 70) {
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'
        ctx.lineWidth = 1
        const step = c.width / r
        for (let i = 1; i < r; i++) {
          ctx.beginPath()
          ctx.moveTo(i * step, 0)
          ctx.lineTo(i * step, c.height)
          ctx.moveTo(0, i * step)
          ctx.lineTo(c.width, i * step)
          ctx.stroke()
        }
      }
    }
    if (!inView) {
      draw(4)
      return
    }
    const ctl = animate(4, ppd, { duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: draw })
    return () => ctl.stop()
  }, [inView, ppd])
  return (
    <figure className="flex flex-col items-center gap-4">
      <div className={`relative aspect-square w-full max-w-[180px] overflow-hidden rounded-full border ${ours ? 'border-accent' : 'border-white/15'}`} style={ours ? { boxShadow: '0 0 40px -6px var(--accent)' } : undefined}>
        <canvas ref={ref} className="h-full w-full" aria-hidden />
      </div>
      <figcaption className="text-center">
        <span className={`block text-[1.6rem] font-[250] ${ours ? 'text-accent' : ''}`}>{ppd} PPD</span>
        <span className="mono-label text-white/45">{label}</span>
      </figcaption>
    </figure>
  )
}

const SPEC_ROWS: [string, string][] = [
  ['Display', 'Dual micro-OLED · 3,660 × 3,200 per eye · 120 Hz'],
  ['Optics', 'Three-element pancake lenses · automatic IPD 51–75 mm'],
  ['Chip', 'Æ1 · 16-core CPU · 48-TOPS neural engine'],
  ['Co-processor', 'R2 · 12 ms sensor fusion, 256 GB/s'],
  ['Cameras', '12 · incl. stereoscopic 6.5 MP spatial capture'],
  ['Sensors', 'LiDAR · TrueDepth · 4 IMUs · flicker & ambient light'],
  ['Audio', 'Personalised spatial audio · 6-mic beamforming array'],
  ['Battery', 'Up to 3 h general use · 2.5 h video · hot-swappable'],
  ['Connectivity', 'Wi-Fi 7 · Bluetooth 6 · Ultra Wideband'],
  ['Weight', '412 g visor · 182 g battery'],
  ['Materials', 'Aerospace titanium · laminated glass · 3D knit'],
  ['Security', 'Iris authentication · on-device processing'],
]

export default function Specs() {
  return (
    <section id="specs" data-scene="specs" className="relative z-[2] bg-ink pb-32 pt-20 md:pb-44">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Eyebrow index="05">Specifications</Eyebrow>
        <RevealWords
          as="h2"
          text="Engineered at the edge of physics."
          italic={[4, 5]}
          className="mt-6 block max-w-[64rem] text-[clamp(2.4rem,6vw,6rem)] font-[300] leading-[0.95] tracking-[-0.04em]"
        />

        {/* Headline metrics */}
        <div className="mt-16 grid grid-cols-2 border-t border-white/10 md:grid-cols-4">
          {[
            { v: 23, d: 0, u: 'M', l: 'Pixels' },
            { v: 120, d: 0, u: 'Hz', l: 'Refresh rate' },
            { v: 3, d: 0, u: 'h', l: 'Battery life' },
            { v: 412, d: 0, u: 'g', l: 'Visor weight' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              className={`border-b border-white/10 py-8 md:border-b-0 md:py-10 ${i % 2 ? 'pl-5' : ''} ${i > 0 ? 'md:border-l md:pl-8' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1.1, ease, delay: i * 0.08 }}
            >
              <p className="text-[clamp(2.8rem,5.5vw,5rem)] font-[200] leading-none tracking-[-0.045em]">
                <CountUp to={m.v} decimals={m.d} />
                <span className="text-accent">{m.u}</span>
              </p>
              <p className="mono-label mt-3 text-white/45">{m.l}</p>
            </motion.div>
          ))}
        </div>

        {/* Engineering grid */}
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[24px] border border-white/10 bg-white/10 md:grid-cols-12">
          <Cell label="Field of view" index="A.01" className="md:col-span-7">
            <FovGauge />
          </Cell>
          <Cell label="Latency" index="A.02" className="md:col-span-5">
            <Latency />
          </Cell>
          <Cell label="Æ1 Neural silicon" index="B.01" className="md:col-span-5">
            <Silicon />
          </Cell>
          <Cell label="Sustained performance" index="B.02" className="md:col-span-7">
            <Performance />
          </Cell>
          <Cell label="Pixel density · pixels per degree" index="C.01" className="md:col-span-12">
            <div className="grid grid-cols-3 gap-4 md:gap-10 md:px-[8%]">
              <Loupe ppd={20} label="Typical headset" />
              <Loupe ppd={34} label="AETHER ONE" ours />
              <Loupe ppd={60} label="Human acuity" />
            </div>
          </Cell>
        </div>

        {/* Full table */}
        <dl className="mt-20 grid gap-x-16 md:grid-cols-2">
          {SPEC_ROWS.map(([k, v], i) => (
            <motion.div
              key={k}
              className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-white/10 py-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.8, ease, delay: (i % 6) * 0.05 }}
            >
              <dt className="mono-label pt-1 text-white/40">{k}</dt>
              <dd className="text-[0.95rem] text-white/85">{v}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
