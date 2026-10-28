'use client'

import { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { setState, useStore } from '@/lib/store'
import { scrollToId } from '@/lib/runtime'
import { RevealWords } from '../ui/Reveal'
import Button, { Arrow } from '../ui/Button'

const WORD = 'AETHER'.split('')

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const play = useStore((s) => s.introDone)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // Layered parallax: each plane travels at its own speed.
  const wordY = useRange(p, [0, 1], ['0vh', '-18vh'])
  const wordScale = useRange(p, [0, 1], [1, 1.22])
  const wordSpacing = useRange(p, [0, 1], ['-0.045em', '0.06em'])
  const wordOpacity = useRange(p, [0, 0.75], [1, 0])
  const copyY = useRange(p, [0, 1], ['0vh', '-32vh'])
  const copyOpacity = useRange(p, [0, 0.45], [1, 0])
  const glowScale = useRange(p, [0, 1], [1, 1.6])

  return (
    <section ref={ref} id="overview" data-scene="hero" className="relative h-[100svh] min-h-[620px] overflow-hidden">
      {/* Ambient light */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[52%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{
          scale: glowScale,
          background: 'radial-gradient(closest-side, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: 'linear-gradient(to top, #050507, transparent)' }}
      />

      {/* Giant wordmark — behind the device */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0 flex items-start justify-center pt-[27svh] md:items-center md:pt-0"
        style={{ y: wordY, scale: wordScale, opacity: wordOpacity }}
      >
        <motion.div
          className="flex select-none text-[clamp(5.5rem,23vw,25rem)] font-[220] leading-[0.8]"
          style={{ letterSpacing: wordSpacing }}
        >
          {WORD.map((l, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.06em]">
              <motion.span
                className="inline-block"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.08) 92%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
                initial={{ y: '105%' }}
                animate={play ? { y: '0%' } : {}}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 + Math.abs(i - 2.5) * 0.09 }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Foreground copy */}
      <motion.div
        className="relative z-[2] mx-auto flex h-full max-w-[1600px] flex-col justify-between px-5 pb-8 pt-28 md:px-10 md:pb-10"
        style={{ y: copyY, opacity: copyOpacity }}
      >
        <div className="flex items-start justify-between">
          <motion.div
            className="mono-label flex items-center gap-3 text-white/55"
            initial={{ opacity: 0, x: -20 }}
            animate={play ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-accent" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            Introducing the first true spatial computer
          </motion.div>
          <motion.span
            className="mono-label hidden text-white/35 md:block"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.1 }}
          >
            N° 001 — Model Æ-01
          </motion.span>
        </div>

        <div className="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="sr-only">AETHER ONE</h1>
            <RevealWords
              as="h2"
              text="Reality, re-rendered."
              italic={[1]}
              play={play}
              delay={0.7}
              stagger={0.1}
              className="block text-[clamp(2.4rem,5.4vw,5.2rem)] font-[300] leading-[0.95] tracking-[-0.035em]"
            />
            <motion.p
              className="mt-5 hidden max-w-[30rem] text-[0.98rem] leading-relaxed text-white/60 sm:block"
              initial={{ opacity: 0, y: 20 }}
              animate={play ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
            >
              AETHER ONE dissolves the boundary between what you see and what you imagine — placing light, sound and
              intelligence into the space around you.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col items-start gap-5 md:items-end"
            initial={{ opacity: 0, y: 20 }}
            animate={play ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.25 }}
          >
            <div className="flex flex-wrap gap-3">
              <Button icon={<Arrow />} onClick={() => setState({ reserveOpen: true })}>
                Reserve yours
              </Button>
              <Button variant="ghost" icon={<Arrow dir="down" />} onClick={() => scrollToId('explore')}>
                <span className="sm:hidden">Explore</span>
                <span className="hidden sm:inline">Explore the design</span>
              </Button>
            </div>
            <p className="mono-label text-white/40">From $3,499 · Ships Spring 2027</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div className="absolute bottom-8 left-1/2 z-[2] hidden -translate-x-1/2 md:block" style={{ opacity: copyOpacity }}>
      <motion.button
        onClick={() => scrollToId('vision')}
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 1 }}
        aria-label="Scroll to the story"
      >
        <span className="mono-label text-white/40">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-4 bg-white" style={{ animation: 'scroll-dot 2.2s cubic-bezier(.65,0,.35,1) infinite' }} />
        </span>
      </motion.button>
      </motion.div>
    </section>
  )
}
