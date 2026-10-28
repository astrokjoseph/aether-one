'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRange } from '@/lib/motion'

type App = { id: string; title: string; icon: ReactNode; body: ReactNode }

const Eq = () => (
  <div className="flex h-[14cqw] items-end gap-[1.2cqw]">
    {[0.2, 0.55, 0.1, 0.8, 0.35, 0.65, 0.15].map((d, i) => (
      <span
        key={i}
        className="block w-[2.2cqw] origin-bottom rounded-full bg-accent"
        style={{ height: '100%', animation: `eq ${0.9 + d}s ease-in-out ${d}s infinite` }}
      />
    ))}
  </div>
)

const APPS: App[] = [
  {
    id: 'music',
    title: 'Now Playing',
    icon: <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
    body: (
      <div className="flex h-full flex-col justify-between">
        <div className="flex gap-[5cqw]">
          <div
            className="aspect-square w-[38cqw] shrink-0 rounded-[4cqw]"
            style={{ background: 'conic-gradient(from 210deg at 30% 70%, #ff6b3d, #7b5cff, #0b0b12, #5ef2cf, #ff6b3d)' }}
          />
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-[5cqw] text-white/50">Lumen Ensemble</p>
              <p className="text-[7.5cqw] leading-tight">Glass Horizons</p>
            </div>
            <Eq />
          </div>
        </div>
        <div>
          <div className="h-[1cqw] overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[62%] bg-white" />
          </div>
          <div className="mt-[2cqw] flex justify-between text-[4.2cqw] text-white/40">
            <span>2:41</span>
            <span>4:18</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
    body: (
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[5cqw] text-white/50">Kyoto</p>
            <p className="text-[22cqw] font-[200] leading-[0.9]">18°</p>
          </div>
          <svg viewBox="0 0 60 34" className="w-[34cqw]" aria-hidden>
            <path d="M4 32a26 26 0 0 1 52 0" fill="none" stroke="rgba(255,255,255,.2)" strokeDasharray="2 3" />
            <circle cx="16" cy="13" r="4" fill="var(--accent)" />
          </svg>
        </div>
        <div className="flex justify-between text-[4.4cqw] text-white/55">
          {['14', '15', '16', '17', '18'].map((h, i) => (
            <div key={h} className="flex flex-col items-center gap-[1.5cqw]">
              <span>{h}:00</span>
              <span className="text-white">{[18, 19, 19, 17, 16][i]}°</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'gallery',
    title: 'Spatial Photos',
    icon: <path d="M4 5h16v14H4zM4 15l4-4 5 5 3-3 4 4" />,
    body: (
      <div className="flex h-full flex-col gap-[3cqw]">
        <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-[2cqw]">
          {[
            'radial-gradient(circle at 30% 30%, #ffd29a, #e3653f 45%, #2a1430)',
            'linear-gradient(160deg, #9be7ff, #2f62d8 60%, #0b1532)',
            'radial-gradient(circle at 70% 80%, #5ef2cf, #10544e 50%, #071514)',
            'linear-gradient(200deg, #f8e7c9, #b28a5b 50%, #2b1d12)',
            'conic-gradient(from 90deg at 50% 60%, #7b5cff, #ff6b9a, #ffcf6b, #7b5cff)',
            'radial-gradient(circle at 50% 120%, #ff6b3d, #351018 60%, #08080c)',
          ].map((bg, i) => (
            <div key={i} className={`rounded-[2.5cqw] ${i === 0 ? 'col-span-2' : ''}`} style={{ background: bg }} />
          ))}
        </div>
        <p className="text-[4.4cqw] text-white/50">Memories · 4,219 spatial</p>
      </div>
    ),
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: <path d="M4 5h16v11H8l-4 4z" />,
    body: (
      <div className="flex h-full flex-col justify-end gap-[2.5cqw] text-[5cqw]">
        <p className="max-w-[78%] self-start rounded-[4cqw] rounded-bl-[1cqw] bg-white/10 px-[4cqw] py-[2.4cqw]">Are you seeing this view?</p>
        <p className="max-w-[78%] self-end rounded-[4cqw] rounded-br-[1cqw] bg-accent px-[4cqw] py-[2.4cqw] text-ink">In 3D. From my sofa.</p>
        <div className="flex gap-[1.4cqw] self-start rounded-full bg-white/10 px-[4cqw] py-[3cqw]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-white/60" style={{ animation: `core 1.2s ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'focus',
    title: 'Focus',
    icon: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    body: (
      <div className="flex h-full items-center justify-center gap-[6cqw]">
        <svg viewBox="0 0 100 100" className="w-[46cqw] -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray="276" strokeDashoffset="92" />
        </svg>
        <div>
          <p className="text-[14cqw] font-[200] leading-none tabular-nums">24:00</p>
          <p className="mt-[2cqw] text-[4.6cqw] text-white/50">Deep work · Session 2</p>
        </div>
      </div>
    ),
  },
]

const LAYOUT = [
  { x: -0.37, y: -0.02, z: -170, ry: 30 },
  { x: -0.19, y: -0.12, z: -50, ry: 15 },
  { x: 0, y: -0.04, z: 0, ry: 0 },
  { x: 0.19, y: -0.12, z: -50, ry: -15 },
  { x: 0.37, y: -0.02, z: -170, ry: -30 },
]

export default function SpatialWindows() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1000, h: 600 })
  const [focus, setFocus] = useState<string | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })
  const rotY = useRange(sx, [-1, 1], [9, -9])
  const rotX = useRange(sy, [-1, 1], [-6, 6])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = size.w < 640
  const winW = size.w * (narrow ? 0.4 : 0.24)

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1400 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
        my.set(((e.clientY - r.top) / r.height) * 2 - 1)
      }}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      onClick={() => setFocus(null)}
    >
      {/* Room: floor grid and horizon */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1a1a22 0%, #08080b 60%)' }} />
      <div
        aria-hidden
        className="absolute -left-1/2 bottom-[-30%] h-[80%] w-[200%]"
        style={{
          transform: 'rotateX(76deg)',
          transformOrigin: 'center top',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 60%, transparent)',
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-[58%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <motion.div className="pointer-events-none absolute inset-0" style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}>
        {APPS.map((app, i) => {
          const L = LAYOUT[i]
          const isF = focus === app.id
          const dim = focus && !isF
          return (
            <motion.button
              key={app.id}
              onClick={(e) => {
                e.stopPropagation()
                setFocus(isF ? null : app.id)
              }}
              className="glass-panel pointer-events-auto absolute left-1/2 top-[44%] flex aspect-[4/3] flex-col overflow-hidden rounded-[18px] p-[5%] text-left [container-type:inline-size]"
              style={{ width: winW, marginLeft: -winW / 2, marginTop: -(winW * 0.75) / 2, transformStyle: 'preserve-3d' }}
              animate={{
                x: isF ? 0 : L.x * size.w * (narrow ? 1.25 : 1),
                y: isF ? 0 : L.y * size.h,
                z: isF ? 260 : dim ? L.z - 220 : L.z,
                rotateY: isF ? 0 : L.ry,
                opacity: dim ? 0.25 : 1,
                filter: dim ? 'blur(3px)' : 'blur(0px)',
              }}
              whileHover={!isF ? { z: L.z + 40 } : undefined}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              aria-pressed={isF}
              aria-label={`${app.title} window`}
            >
              <div className="mb-[4cqw] flex items-center gap-[2.5cqw]">
                <svg viewBox="0 0 24 24" className="h-[6cqw] w-[6cqw] text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {app.icon}
                </svg>
                <span className="text-[4.6cqw] text-white/70">{app.title}</span>
                <span className="ml-auto flex gap-[1.2cqw]">
                  <span className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-white/25" />
                  <span className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-white/25" />
                </span>
              </div>
              <div className="min-h-0 flex-1">{app.body}</div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Dock */}
      <div className="glass-panel absolute bottom-[6%] left-1/2 flex -translate-x-1/2 gap-2 rounded-full p-2" onClick={(e) => e.stopPropagation()}>
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => setFocus(focus === app.id ? null : app.id)}
            className={`grid h-9 w-9 place-items-center rounded-full transition-all duration-300 md:h-11 md:w-11 ${
              focus === app.id ? 'bg-accent text-ink' : 'bg-white/[0.06] text-white/80 hover:-translate-y-1 hover:bg-white/15'
            }`}
            aria-label={`Open ${app.title}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {app.icon}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
