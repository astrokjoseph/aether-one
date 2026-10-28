'use client'

import { useRef } from 'react'
import { motion, transform, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { useState } from 'react'
import { Eyebrow } from '../ui/Reveal'

const CHAPTERS = [
  {
    n: '01',
    kicker: 'Unibody · Aerospace titanium',
    title: ['Carved from a single', 'block of titanium.'],
    body: 'A five-axis milled frame, a third lighter than aluminium, holds every component in perfect alignment. Its weight rests on a three-dimensional knit band — so the hours disappear, too.',
    metric: 412,
    unit: 'g',
    label: 'Total weight, balanced front to back',
  },
  {
    n: '02',
    kicker: 'Optical stack · Five layers',
    title: ['Five layers.', 'One window to everything.'],
    body: 'Laminated cover glass, dual micro-OLED panels, custom pancake lenses and a light seal shaped to you. Every layer exists to vanish — leaving only what you choose to see.',
    metric: 23,
    unit: 'M',
    label: 'Pixels across two postage-stamp displays',
  },
  {
    n: '03',
    kicker: 'Perception · R2 co-processor',
    title: ['It sees the world', 'the way you do.'],
    body: 'Twelve cameras, a LiDAR scanner and six microphones stream to a dedicated R2 chip, rebuilding your room in eight milliseconds — faster than a blink can register.',
    metric: 12,
    unit: '',
    label: 'Cameras & sensors, fused in real time',
  },
]

const LAYERS = ['Cover glass', 'Micro-OLED', 'Pancake optics', 'Titanium frame', 'Light seal', 'Halo band']

function Chapter({ i, p }: { i: number; p: MotionValue<number> }) {
  const c = CHAPTERS[i]
  const a = i / 3
  const b = (i + 1) / 3
  const first = i === 0
  const last = i === 2
  const inStart = first ? 0 : a - 0.06
  const inEnd = first ? 0.001 : a + 0.02
  const outStart = last ? 0.998 : b - 0.06
  const outEnd = last ? 1 : b + 0.02
  const SHOWN = 'inset(0% 0% 0% 0%)'
  // Masking transition: chapters wipe in from below and wipe out upward.
  // Function transforms run on the JS side, so the end states hold reliably.
  const range = [inStart, inEnd, outStart, outEnd]
  const clipFor = transform(range, [first ? SHOWN : 'inset(100% 0% 0% 0%)', SHOWN, SHOWN, last ? SHOWN : 'inset(0% 0% 100% 0%)'])
  const yFor = transform(range, [first ? 0 : 12, 0, 0, last ? 0 : -12])
  const clip = useTransform(p, (v) => clipFor(v))
  const y = useTransform(p, (v) => `${yFor(v)}vh`)
  const visibility = useTransform(p, (v) => (v >= inStart - 0.01 && v <= outEnd + 0.01 ? 'visible' : 'hidden'))
  const numY = useRange(p, [Math.max(0, a - 0.1), Math.min(1, b + 0.1)], ['30%', '-30%'])
  const line1 = useTransform(p, first ? [0, 0.04] : [a - 0.04, a + 0.05], ['110%', '0%'])
  const line2 = useTransform(p, first ? [0.01, 0.06] : [a - 0.02, a + 0.07], ['110%', '0%'])
  const metric = useRange(p, [a, a + 0.16], [0, c.metric])
  const [value, setValue] = useState(0)
  useMotionValueEvent(metric, 'change', (v) => setValue(Math.round(v)))

  return (
    <motion.article className="absolute inset-0 flex flex-col justify-center" style={{ clipPath: clip, y, visibility }} aria-label={c.title.join(' ')}>
      <motion.span
        aria-hidden
        className="text-outline pointer-events-none absolute -left-2 top-[8%] select-none text-[clamp(8rem,20vw,20rem)] font-[200] leading-none md:top-[4%]"
        style={{ y: numY }}
      >
        {c.n}
      </motion.span>
      <div className="relative">
        <p className="mono-label text-accent">{c.kicker}</p>
        <h3 className="mt-5 text-[clamp(2rem,4.4vw,4.4rem)] font-[300] leading-[1.02] tracking-[-0.035em]">
          {c.title.map((t, k) => (
            <span key={k} className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" style={{ y: k === 0 ? line1 : line2 }}>
                {t}
              </motion.span>
            </span>
          ))}
        </h3>
        <p className="mt-6 max-w-[30rem] text-[0.98rem] leading-relaxed text-white/60">{c.body}</p>
        <div className="mt-10 flex items-end gap-5 border-t border-white/10 pt-6">
          <span className="text-[clamp(3rem,6vw,5.5rem)] font-[200] leading-[0.8] tabular-nums tracking-[-0.04em]">
            {value}
            <span className="text-accent">{c.unit}</span>
          </span>
          <span className="mono-label max-w-[12rem] pb-1 text-white/45">{c.label}</span>
        </div>
      </div>
    </motion.article>
  )
}

function LayerLegend({ p }: { p: MotionValue<number> }) {
  const opacity = useRange(p, [0.36, 0.42, 0.6, 0.66], [0, 1, 1, 0])
  return (
    <motion.ol className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-4 md:right-10 lg:flex" style={{ opacity }}>
      {LAYERS.map((l, i) => (
        <LayerItem key={l} label={l} i={i} p={p} />
      ))}
    </motion.ol>
  )
}

function LayerItem({ label, i, p }: { label: string; i: number; p: MotionValue<number> }) {
  const s = 0.38 + i * 0.022
  const x = useRange(p, [s, s + 0.04], ['24px', '0px'])
  const o = useRange(p, [s, s + 0.04], [0, 1])
  return (
    <motion.li className="flex items-center justify-end gap-3" style={{ x, opacity: o }}>
      <span className="mono-label text-white/60">{label}</span>
      <span className="font-mono text-[0.65rem] text-accent">0{i + 1}</span>
      <span className="h-px w-10 bg-white/30" />
    </motion.li>
  )
}

function Progress({ p }: { p: MotionValue<number> }) {
  return (
    <div className="absolute bottom-8 left-5 flex gap-2 md:bottom-auto md:left-10 md:top-1/2 md:-translate-y-1/2 md:flex-col">
      {CHAPTERS.map((c, i) => (
        <ProgressTick key={c.n} i={i} p={p} />
      ))}
    </div>
  )
}

function ProgressTick({ i, p }: { i: number; p: MotionValue<number> }) {
  const fill = useRange(p, [i / 3, (i + 1) / 3], [0, 1])
  return (
    <span className="relative block h-[2px] w-10 overflow-hidden bg-white/15 md:h-10 md:w-[2px]">
      <motion.span className="absolute inset-0 hidden origin-top bg-accent md:block" style={{ scaleY: fill }} />
      <motion.span className="absolute inset-0 origin-left bg-accent md:hidden" style={{ scaleX: fill }} />
    </span>
  )
}

export default function Design() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const scanY = useRange(p, [0.66, 0.9], ['-10%', '110%'])
  const scanO = useRange(p, [0.66, 0.7, 0.86, 0.9], [0, 1, 1, 0])

  return (
    <section ref={ref} id="design" data-scene="design" className="relative h-[440vh]">
      <div className="sticky top-0 z-[2] h-[100svh] overflow-hidden">
        {/* Sensor scan beam, chapter 3 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-[2px] md:left-[45%]"
          style={{
            top: scanY,
            opacity: scanO,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            boxShadow: '0 0 30px 6px color-mix(in oklab, var(--accent) 40%, transparent)',
          }}
        />
        <div className="relative mx-auto h-full max-w-[1600px] px-5 md:px-10 md:pl-24">
          <Eyebrow index="02" className="absolute top-24 md:top-28">
            Design
          </Eyebrow>
          <div className="absolute inset-x-5 bottom-[12vh] top-[46%] md:inset-x-auto md:bottom-0 md:left-24 md:top-0 md:w-[44%]">
            {CHAPTERS.map((_, i) => (
              <Chapter key={i} i={i} p={p} />
            ))}
          </div>
        </div>
        <LayerLegend p={p} />
        <Progress p={p} />
      </div>
    </section>
  )
}
