'use client'

import { useRef } from 'react'
import { motion, useScroll } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { setState } from '@/lib/store'
import { scrollToId, scrollToTop } from '@/lib/runtime'
import { Logo, SECTIONS } from '../ui/Nav'
import Button, { Arrow } from '../ui/Button'

const LETTERS = 'Look up.'.split('')

export default function Finale() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const horizon = useRange(p, [0, 0.7], ['100%', '38%'])
  const horizonO = useRange(p, [0, 0.5], [0, 1])
  const spacing = useRange(p, [0.15, 0.7], ['0.5em', '-0.04em'])
  const mask = useRange(p, [0.15, 0.65], ['inset(0% 50% 0% 50%)', 'inset(0% 0% 0% 0%)'])
  const titleY = useRange(p, [0.15, 0.7], ['8vh', '0vh'])
  const ctaO = useRange(p, [0.6, 0.78], [0, 1])
  const ctaY = useRange(p, [0.6, 0.78], ['30px', '0px'])
  const footO = useRange(p, [0.8, 0.95], [0, 1])

  return (
    <section ref={ref} id="reserve" data-scene="finale" className="relative h-[230vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Dawn horizon */}
        <motion.div
          aria-hidden
          className="absolute inset-x-[-20%] h-[140%] rounded-[50%]"
          style={{
            top: horizon,
            opacity: horizonO,
            background:
              'radial-gradient(50% 30% at 50% 0%, color-mix(in oklab, var(--accent) 55%, white 10%) 0%, color-mix(in oklab, var(--accent) 25%, transparent) 30%, transparent 70%)',
            boxShadow: '0 -1px 0 0 color-mix(in oklab, var(--accent) 60%, transparent)',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-px"
          style={{ top: horizon, opacity: horizonO, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
        />

        <div className="relative z-[2] mx-auto flex h-full max-w-[1600px] flex-col items-center justify-end px-5 pb-[18vh] text-center md:px-10 md:pb-[14vh]">
          <motion.h2
            className="text-[clamp(4.2rem,15vw,15rem)] font-[250] leading-[0.85]"
            style={{ letterSpacing: spacing, clipPath: mask, y: titleY }}
          >
            {LETTERS.map((l, i) => (
              <span key={i} className={l === '.' ? 'text-accent' : i >= 5 ? 'font-serif italic font-normal' : ''}>
                {l === ' ' ? ' ' : l}
              </span>
            ))}
          </motion.h2>
          <motion.div className="mt-8 flex flex-col items-center gap-6" style={{ opacity: ctaO, y: ctaY }}>
            <p className="max-w-[34rem] text-[1.02rem] leading-relaxed text-white/60">
              AETHER ONE. Reservations open today, with a fully refundable deposit. First deliveries Spring 2027.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button icon={<Arrow />} onClick={() => setState({ reserveOpen: true })}>
                Reserve AETHER ONE
              </Button>
              <Button variant="ghost" icon={<Arrow dir="up" />} onClick={scrollToTop}>
                Back to the beginning
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.footer className="absolute inset-x-0 bottom-0 z-[2] border-t border-white/10" style={{ opacity: footO }}>
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="flex items-center gap-3">
              <Logo className="h-6 w-6" />
              <span className="mono-label text-white/50">© 2026 Aether Labs · A fictional product concept</span>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button onClick={() => scrollToId(s.id)} className="mono-label text-white/45 transition-colors hover:text-white">
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.footer>
      </div>
    </section>
  )
}
