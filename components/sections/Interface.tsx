'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll } from 'framer-motion'
import { useRange } from '@/lib/motion'
import { Eyebrow, RevealWords } from '../ui/Reveal'
import SpatialWindows from '../interface/SpatialWindows'
import Hologram from '../interface/Hologram'
import GestureLab from '../interface/GestureLab'

const MODES = [
  {
    id: 'windows',
    label: 'Spatial windows',
    title: 'Apps that live in your room.',
    copy: 'Windows float at any size, any distance, anchored to the world around you. Look at one to bring it close.',
    hint: 'Move your cursor to look around · click a window or the dock',
  },
  {
    id: 'hologram',
    label: 'Holographic display',
    title: 'Objects with real depth.',
    copy: 'Volumetric content renders with true parallax and light, so a planet, a molecule or a landscape sits on your desk like it belongs there.',
    hint: 'Drag the hologram · switch models below',
  },
  {
    id: 'gestures',
    label: 'Gesture control',
    title: 'Your hands are the controller.',
    copy: 'A glance targets. A pinch selects. Twelve cameras read the subtlest motion of your fingers — even resting in your lap.',
    hint: 'Tap, double tap, hold or drag on the stage — or use arrow keys, Enter, E and Space',
  },
] as const

export default function Interface() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('windows')
  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({ target: stageRef, offset: ['start end', 'center center'] })
  const rotateX = useRange(p, [0, 1], [22, 0])
  const scale = useRange(p, [0, 1], [0.86, 1])
  const y = useRange(p, [0, 1], ['10%', '0%'])
  const radius = useRange(p, [0, 1], [60, 28])
  const current = MODES.find((m) => m.id === mode)!

  return (
    <section id="interface" data-scene="interface" className="relative z-[2] bg-ink pb-28 pt-32 md:pb-40 md:pt-44">
      <div aria-hidden className="absolute inset-x-0 -top-40 h-40 bg-gradient-to-b from-transparent to-ink" />
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <Eyebrow index="04">Interface</Eyebrow>
            <RevealWords
              as="h2"
              text="Your space is the interface."
              italic={[1]}
              className="mt-6 block text-[clamp(2.4rem,6vw,6rem)] font-[300] leading-[0.95] tracking-[-0.04em]"
            />
          </div>
          <motion.p
            className="max-w-[30rem] text-[1rem] leading-relaxed text-white/60"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            Aether OS is spatial computing rebuilt from first principles. No windows to manage, no cables, no screen edges —
            just content that understands where you are, what you are looking at and what your hands are doing.
          </motion.p>
        </div>

        {/* Mode selector */}
        <div className="mt-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 md:w-auto" role="tablist" aria-label="Interface demos">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                id={`tab-${m.id}`}
                aria-selected={mode === m.id}
                aria-controls="interface-stage"
                onClick={() => setMode(m.id)}
                className={`relative shrink-0 rounded-full px-4 py-2.5 text-[0.8rem] transition-colors md:px-5 ${
                  mode === m.id ? 'text-ink' : 'text-white/65 hover:text-white'
                }`}
              >
                {mode === m.id && (
                  <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-bone" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={current.id}
              className="mono-label text-white/40"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {current.hint}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Stage */}
        <div className="mt-8" style={{ perspective: 1600 }}>
          <motion.div
            ref={stageRef}
            id="interface-stage"
            role="tabpanel"
            aria-labelledby={`tab-${mode}`}
            className="relative aspect-[4/5] w-full overflow-hidden border border-white/10 sm:aspect-[16/10] md:aspect-[16/9]"
            style={{ rotateX, scale, y, borderRadius: radius, transformOrigin: 'center top' }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={mode}
                className="absolute inset-0"
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(75% at 50% 50%)' }}
                exit={{ opacity: 0.3 }}
                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              >
                {mode === 'windows' && <SpatialWindows />}
                {mode === 'hologram' && <Hologram />}
                {mode === 'gestures' && <GestureLab />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="mt-10 grid gap-4 md:grid-cols-[1fr_1.4fr]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-[clamp(1.4rem,2.4vw,2rem)] font-[350] tracking-[-0.02em]">{current.title}</h3>
            <p className="max-w-[36rem] text-white/55">{current.copy}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
