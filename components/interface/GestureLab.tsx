'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'

const CARDS = [
  { title: 'Cinema', sub: 'A 100-foot screen, anywhere', bg: 'radial-gradient(circle at 30% 20%, #ffb36b, #b8402a 45%, #1a0c10)' },
  { title: 'Workspace', sub: 'Infinite displays for your laptop', bg: 'linear-gradient(150deg, #a7c4ff, #3d5bd9 55%, #0d1430)' },
  { title: 'Memories', sub: 'Spatial photos you can step into', bg: 'radial-gradient(circle at 70% 70%, #ffd6e8, #c0477c 45%, #1c0a16)' },
  { title: 'Presence', sub: 'Calls with people at life size', bg: 'linear-gradient(200deg, #9ff5dc, #1d8a78 55%, #061614)' },
  { title: 'Stillness', sub: 'Immersive mindful environments', bg: 'radial-gradient(circle at 50% 110%, #f7e2b5, #8a6a3e 50%, #120d07)' },
]

type Gesture = 'tap' | 'double' | 'hold' | 'swipe-l' | 'swipe-r' | 'release'
const NAMES: Record<Gesture, string> = {
  tap: 'Tap — select',
  double: 'Double tap — expand',
  hold: 'Pinch & hold — grab',
  'swipe-l': 'Swipe ← — next',
  'swipe-r': 'Swipe → — previous',
  release: 'Release',
}

/** Thumb & index fingertip dots that visualise the current gesture. */
function PinchGlyph({ pressing, grabbed }: { pressing: boolean; grabbed: boolean }) {
  const gap = grabbed ? 0 : pressing ? 6 : 16
  return (
    <div className="relative grid h-12 w-12 place-items-center rounded-full border border-white/15">
      <motion.span className="absolute h-2.5 w-2.5 rounded-full bg-white" animate={{ y: -gap / 2 - 2 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} />
      <motion.span
        className="absolute h-2.5 w-2.5 rounded-full bg-accent"
        animate={{ y: gap / 2 + 2, scale: grabbed ? 1.5 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      />
    </div>
  )
}

export default function GestureLab() {
  const [index, setIndex] = useState(2)
  const [selected, setSelected] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [grabbed, setGrabbed] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [log, setLog] = useState<{ g: Gesture; id: number }[]>([])
  const [inside, setInside] = useState(false)
  const cx = useMotionValue(0)
  const cy = useMotionValue(0)
  const sx = useSpring(cx, { stiffness: 500, damping: 35 })
  const sy = useSpring(cy, { stiffness: 500, damping: 35 })
  const press = useRef<{ x: number; y: number; t: number; moved: boolean; id: number } | null>(null)
  const holdTimer = useRef<number>(0)
  const tapTimer = useRef<number>(0)
  const lastTap = useRef(0)
  const uid = useRef(0)
  const indexRef = useRef(index)
  indexRef.current = index

  const push = (g: Gesture) => setLog((l) => [{ g, id: ++uid.current }, ...l].slice(0, 4))

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current)
      window.clearTimeout(tapTimer.current)
    },
    [],
  )

  const swipe = (dir: -1 | 1) => {
    setIndex((i) => Math.max(0, Math.min(CARDS.length - 1, i + dir)))
    setExpanded(false)
    push(dir === 1 ? 'swipe-l' : 'swipe-r')
  }
  const tap = () => {
    setSelected((s) => (s === indexRef.current ? null : indexRef.current))
    push('tap')
  }
  const doubleTap = () => {
    setExpanded((e) => !e)
    setSelected(indexRef.current)
    push('double')
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-ui]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId }
    setPressing(true)
    holdTimer.current = window.setTimeout(() => {
      if (press.current && !press.current.moved) {
        setGrabbed(true)
        push('hold')
      }
    }, 450)
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    cx.set(e.clientX - r.left)
    cy.set(e.clientY - r.top)
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x
    if (Math.abs(dx) > 8 || Math.abs(e.clientY - p.y) > 8) p.moved = true
    if (Math.abs(dx) > 60) {
      window.clearTimeout(holdTimer.current)
      swipe(dx < 0 ? 1 : -1)
      p.x = e.clientX
    }
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    window.clearTimeout(holdTimer.current)
    press.current = null
    setPressing(false)
    if (grabbed) {
      setGrabbed(false)
      push('release')
      return
    }
    if (!p.moved && performance.now() - p.t < 350) {
      const now = performance.now()
      if (now - lastTap.current < 320) {
        window.clearTimeout(tapTimer.current)
        lastTap.current = 0
        doubleTap()
      } else {
        lastTap.current = now
        tapTimer.current = window.setTimeout(tap, 260)
      }
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') swipe(1)
    else if (e.key === 'ArrowLeft') swipe(-1)
    else if (e.key === 'Enter') tap()
    else if (e.key.toLowerCase() === 'e') doubleTap()
    else if (e.key === ' ') {
      e.preventDefault()
      push(grabbed ? 'release' : 'hold')
      setGrabbed(!grabbed)
    } else return
  }

  const latest = log[0]

  return (
    <div
      className="absolute inset-0 touch-pan-y select-none overflow-hidden outline-none"
      style={{ background: 'radial-gradient(100% 80% at 50% 40%, #15151c, #060608 75%)', perspective: 1200, cursor: inside ? 'none' : 'auto' }}
      tabIndex={0}
      role="application"
      aria-label="Gesture lab. Tap to select, double tap to expand, press and hold to grab, drag sideways to swipe. Keyboard: arrows, Enter, E and Space."
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setInside(true)}
      onPointerLeave={() => setInside(false)}
      onKeyDown={onKey}
    >
      {/* Cards (coverflow) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        {CARDS.map((c, i) => {
          const o = i - index
          const isCenter = o === 0
          const big = isCenter && expanded
          return (
            <motion.div
              key={c.title}
              className="absolute aspect-[3/4] w-[36%] max-w-[260px] overflow-hidden rounded-[22px] border md:w-[22%]"
              style={{ background: c.bg, transformStyle: 'preserve-3d' }}
              animate={{
                x: `${o * 72}%`,
                z: isCenter ? (grabbed ? 160 : big ? 120 : 0) : -Math.abs(o) * 170,
                rotateY: o * -32,
                scale: big ? 1.45 : grabbed && isCenter ? 1.08 : 1,
                opacity: Math.abs(o) > 2 ? 0 : 1 - Math.abs(o) * 0.22,
                borderColor: selected === i ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                boxShadow:
                  grabbed && isCenter
                    ? '0 40px 80px -20px color-mix(in oklab, var(--accent) 70%, transparent)'
                    : '0 20px 60px -30px rgba(0,0,0,0.8)',
              }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-[9%]">
                <p className="text-[clamp(0.9rem,1.4vw,1.25rem)] font-medium">{c.title}</p>
                <p className="mt-1 text-[clamp(0.62rem,0.85vw,0.78rem)] text-white/70">{c.sub}</p>
                <AnimatePresence>
                  {big && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mono-label mt-2 text-[0.5rem] text-accent"
                    >
                      Opened in your space
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {selected === i && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-accent" style={{ boxShadow: '0 0 12px var(--accent)' }} />}
            </motion.div>
          )
        })}
      </div>

      {/* Gaze cursor */}
      {inside && (
        <motion.div className="pointer-events-none absolute left-0 top-0 z-10" style={{ x: sx, y: sy }}>
          <motion.span
            className="absolute -left-5 -top-5 h-10 w-10 rounded-full border border-white/70"
            animate={{ scale: grabbed ? 0.5 : pressing ? 0.7 : 1, borderColor: pressing || grabbed ? 'var(--accent)' : 'rgba(255,255,255,0.7)' }}
          />
          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-white" />
        </motion.div>
      )}

      {/* HUD */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 md:left-6 md:top-6">
        <PinchGlyph pressing={pressing} grabbed={grabbed} />
        <div>
          <span className="mono-label block text-white/40">Recognised</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={latest?.id ?? 'idle'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="block text-[0.9rem]"
            >
              {latest ? NAMES[latest.g] : 'Waiting for your hand…'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <ol className="pointer-events-none absolute right-4 top-4 hidden flex-col items-end gap-1 md:right-6 md:top-6 md:flex" aria-live="polite">
        {log.map((l, i) => (
          <motion.li key={l.id} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1 - i * 0.22, x: 0 }} className="mono-label text-white/60">
            {NAMES[l.g]}
          </motion.li>
        ))}
      </ol>

      <div data-ui className="absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-1.5 px-3 md:bottom-6">
        {[
          ['Tap', 'select'],
          ['Double tap', 'expand'],
          ['Hold', 'grab'],
          ['Drag', 'swipe'],
        ].map(([a, b]) => (
          <span key={a} className="glass-panel rounded-full px-3 py-1.5 text-[0.68rem] text-white/70">
            <span className="text-white">{a}</span> · {b}
          </span>
        ))}
      </div>
    </div>
  )
}
