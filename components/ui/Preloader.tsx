'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { setState } from '@/lib/store'
import { runtime } from '@/lib/runtime'

const LETTERS = 'AETHER'.split('')

export default function Preloader() {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
      setState({ introDone: true })
      return
    }
    runtime.lenis?.stop()
    let cancelled = false
    const finish = () => {
      if (cancelled) return
      setDone(true)
      runtime.lenis?.start()
      window.setTimeout(() => setState({ introDone: true }), 250)
    }
    const controls = animate(0, 100, {
      duration: 2.1,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setProgress(Math.round(v)),
      onComplete: () => {
        const started = performance.now()
        const wait = () => {
          if (cancelled) return
          if (runtime.sceneReady || performance.now() - started > 3500) finish()
          else requestAnimationFrame(wait)
        }
        wait()
      },
    })
    return () => {
      cancelled = true
      controls.stop()
    }
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-ink px-6 py-6 md:px-10 md:py-8"
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          aria-live="polite"
          aria-label={`Loading ${progress}%`}
        >
          <div className="flex items-center justify-between text-white/40">
            <span className="mono-label">Aether Labs</span>
            <span className="mono-label">Spatial Computer · Æ-01</span>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex overflow-hidden text-[clamp(3rem,11vw,9rem)] font-[250] leading-none tracking-[-0.04em]">
              {LETTERS.map((l, i) => (
                <span
                  key={i}
                  className="inline-block text-chrome"
                  style={{ animation: `rise 1.1s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.07}s both` }}
                >
                  {l}
                </span>
              ))}
            </div>
            <div className="relative h-px w-[min(420px,70vw)] overflow-hidden bg-white/10">
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: `${progress}%`, boxShadow: '0 0 18px var(--accent)' }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <span className="mono-label text-white/40">Calibrating optics</span>
            <span className="font-mono text-[clamp(2.5rem,6vw,5rem)] font-light leading-none tabular-nums text-white/90">
              {String(progress).padStart(3, '0')}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
