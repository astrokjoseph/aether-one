'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FINISHES } from '@/lib/finishes'
import { setState, useStore } from '@/lib/store'
import { Eyebrow, RevealWords } from '../ui/Reveal'
import Button, { Arrow } from '../ui/Button'
import { useDragRotate } from '../ui/useDragRotate'

export default function FinishSection() {
  const finish = useStore((s) => s.finish)
  const f = FINISHES[finish]
  const drag = useDragRotate()
  const groupRef = useRef<HTMLDivElement>(null)

  const choose = (i: number) => setState({ finish: (i + FINISHES.length) % FINISHES.length })

  return (
    <section id="finish" data-scene="finish" className="relative h-[150vh]">
      {/* No z-index: this layer sits beneath the WebGL device, so the finish name glows behind it. */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 transition-[background] duration-1000"
          style={{ background: 'radial-gradient(60% 55% at 50% 55%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 70%)' }}
        />

        {/* Giant finish name */}
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div key={f.id} className="flex text-[clamp(5rem,22vw,22rem)] font-[200] leading-none tracking-[-0.05em]">
              {f.name.split('').map((l, i) => (
                <span key={i} className="inline-block overflow-hidden">
                  <motion.span
                    className="inline-block"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0.03))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '-100%' }}
                    transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: i * 0.035 }}
                  >
                    {l}
                  </motion.span>
                </span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Light sweep on change */}
        <AnimatePresence>
          <motion.div
            key={f.id}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-[30%]"
            style={{ background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 18%, transparent), transparent)' }}
            initial={{ left: '-30%' }}
            animate={{ left: '110%' }}
            transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
          />
        </AnimatePresence>

        <div {...drag} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" role="presentation" />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-[1600px] flex-col justify-between px-5 pb-8 pt-24 md:px-10 md:pb-12 md:pt-28">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Eyebrow index="06">Finish</Eyebrow>
              <RevealWords
                as="h2"
                text="Choose your light."
                italic={[2]}
                className="mt-5 block text-[clamp(2rem,4vw,3.8rem)] font-[300] leading-none tracking-[-0.035em]"
              />
            </div>
            <p className="mono-label hidden text-right text-white/40 md:block">
              Drag to turn
              <br />
              Colour updates live
            </p>
          </div>

          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto_1fr]">
            <AnimatePresence mode="wait">
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="hidden max-w-[22rem] md:block"
              >
                <p className="text-[1.5rem] font-[350] tracking-[-0.02em]">{f.name}</p>
                <p className="mono-label mt-1 text-accent">
                  {f.material} · {f.light}
                </p>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-white/55">{f.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Swatches */}
            <div
              ref={groupRef}
              className="glass-panel pointer-events-auto mx-auto flex items-center gap-2 rounded-full p-2"
              role="radiogroup"
              aria-label="Finish"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  choose(finish + 1)
                  ;(groupRef.current?.querySelectorAll('button')[(finish + 1) % FINISHES.length] as HTMLButtonElement)?.focus()
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  choose(finish - 1)
                  ;(groupRef.current?.querySelectorAll('button')[(finish - 1 + FINISHES.length) % FINISHES.length] as HTMLButtonElement)?.focus()
                }
              }}
            >
              {FINISHES.map((x, i) => {
                const on = i === finish
                return (
                  <button
                    key={x.id}
                    role="radio"
                    aria-checked={on}
                    aria-label={`${x.name} — ${x.material}`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(i)}
                    className="group relative flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-1.5 md:pr-4"
                  >
                    {on && (
                      <motion.span layoutId="swatch-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                    )}
                    <span
                      className={`relative h-9 w-9 rounded-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-110 ${on ? 'scale-105' : ''}`}
                      style={{
                        background: `radial-gradient(circle at 32% 28%, #fff 0%, ${x.swatch[0]} 22%, ${x.swatch[1]} 78%)`,
                        boxShadow: on ? `0 0 0 2px #050507, 0 0 0 3.5px ${x.accent}` : 'inset 0 0 0 1px rgba(255,255,255,.15)',
                      }}
                    />
                    <span className={`relative hidden text-[0.8rem] md:inline ${on ? 'text-white' : 'text-white/55'}`}>{x.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="pointer-events-auto flex flex-col items-center gap-3 md:items-end">
              <p className="text-center md:hidden">
                <span className="text-[1.1rem]">{f.name}</span> <span className="mono-label text-accent">· {f.light}</span>
              </p>
              <Button icon={<Arrow />} onClick={() => setState({ reserveOpen: true })}>
                Reserve in {f.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
