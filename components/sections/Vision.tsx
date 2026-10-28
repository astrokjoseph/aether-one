'use client'

import { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { Eyebrow, ScrubWord } from '../ui/Reveal'

const STATEMENT =
  'For fifty years we have looked down into glowing rectangles. AETHER ONE lifts your gaze — placing light, sound and intelligence into the space around you, exactly where it belongs.'
const ITALIC = new Set(['lifts', 'your', 'gaze', 'belongs.'])

const FACTS = [
  { k: '0', l: 'Screens to hold' },
  { k: '∞', l: 'Canvas in every room' },
  { k: '1', l: 'Glance to begin' },
]

export default function Vision() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = STATEMENT.split(' ')

  const bgX = useRange(p, [0, 1], ['8%', '-48%'])
  const bgX2 = useRange(p, [0, 1], ['-40%', '6%'])
  const lineScale = useRange(p, [0.02, 0.8], [0, 1])
  const factsY = useRange(p, [0.72, 0.92], ['40px', '0px'])
  const factsO = useRange(p, [0.72, 0.92], [0, 1])

  return (
    <section ref={ref} id="vision" data-scene="vision" className="relative h-[320vh]">
      <div className="sticky top-0 z-[2] flex h-[100svh] items-end overflow-hidden md:items-center">
        {/* Background parallax type */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-[2vh] opacity-80">
          <motion.div style={{ x: bgX }} className="text-outline whitespace-nowrap text-[22vw] font-[200] leading-none tracking-[-0.05em]">
            Look up · Look up ·
          </motion.div>
          <motion.div style={{ x: bgX2 }} className="text-outline whitespace-nowrap font-serif text-[14vw] italic leading-none">
            beyond the rectangle — beyond
          </motion.div>
        </div>

        <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-[9vh] md:px-10 md:pb-0">
          <div className="max-w-[62rem] md:w-[60%]">
            <Eyebrow index="01">Vision</Eyebrow>
            <p className="mt-8 text-[clamp(1.55rem,3.3vw,3.3rem)] font-[300] leading-[1.12] tracking-[-0.025em]">
              {words.map((w, i) => {
                const start = 0.04 + (i / words.length) * 0.66
                return (
                  <span key={i}>
                    <ScrubWord
                      progress={p}
                      range={[start, start + 0.08]}
                      className={ITALIC.has(w) ? 'font-serif italic text-accent' : w === 'AETHER' || w === 'ONE' ? 'font-medium' : ''}
                    >
                      {w}
                    </ScrubWord>{' '}
                  </span>
                )
              })}
            </p>

            <div className="mt-10 h-px w-full max-w-[34rem] bg-white/10">
              <motion.div className="h-full origin-left bg-accent" style={{ scaleX: lineScale }} />
            </div>

            <motion.dl className="mt-8 grid max-w-[34rem] grid-cols-3 gap-6" style={{ y: factsY, opacity: factsO }}>
              {FACTS.map((f) => (
                <div key={f.l}>
                  <dt className="text-[clamp(1.8rem,3vw,2.6rem)] font-[250] leading-none">{f.k}</dt>
                  <dd className="mono-label mt-2 text-white/45">{f.l}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </div>
      </div>
    </section>
  )
}
