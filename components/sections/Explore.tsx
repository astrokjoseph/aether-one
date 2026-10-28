'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { runtime, type HotspotId } from '@/lib/runtime'
import { EXPLORE_POSE } from '@/lib/poses'
import { Eyebrow, RevealWords } from '../ui/Reveal'
import { useDragRotate } from '../ui/useDragRotate'

type Detail = {
  id: HotspotId
  name: string
  copy: string
  stats: [string, string][]
  view: { rx: number; ry: number; zoom: number }
}

const DETAILS: Detail[] = [
  {
    id: 'optics',
    name: 'Laminated optics',
    copy: 'A single sheet of three-dimensionally formed, laminated glass flows into the frame — a lens for the cameras and a canvas for the living front display.',
    stats: [['Glass', '3D laminated'], ['Coating', 'Anti-reflective ×7']],
    view: { rx: 0.05, ry: -0.15, zoom: 1.32 },
  },
  {
    id: 'sensors',
    name: 'Sensor array',
    copy: 'Twelve cameras and a LiDAR scanner sit invisibly behind the glass, mapping hands, surfaces and depth at 90 frames per second.',
    stats: [['Cameras', '12'], ['Latency', '8 ms']],
    view: { rx: -0.32, ry: 0.1, zoom: 1.45 },
  },
  {
    id: 'crown',
    name: 'Digital crown',
    copy: 'Turn to blend between your world and fully immersive environments. Press to summon the home view. Machined, knurled, unmistakable.',
    stats: [['Detents', '120 haptic'], ['Material', 'Solid titanium']],
    view: { rx: 0.55, ry: -0.65, zoom: 1.5 },
  },
  {
    id: 'band',
    name: 'Halo band',
    copy: 'A single 3D-knitted band in breathable, stretchable yarn, with spatial audio pods tuned to your ear geometry.',
    stats: [['Knit', 'Single-piece 3D'], ['Audio', 'Personalised spatial']],
    view: { rx: 0.15, ry: 1.25, zoom: 1.05 },
  },
  {
    id: 'seal',
    name: 'Light seal',
    copy: 'Magnetically attached cushions, sized from a scan of your face, shut out stray light and let the displays float in perfect darkness.',
    stats: [['Fit', '28 sizes'], ['Attach', 'Magnetic']],
    view: { rx: 0.2, ry: 2.75, zoom: 1.2 },
  },
]

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export default function Explore() {
  const [selected, setSelected] = useState<HotspotId | null>(null)
  const [zoom, setZoom] = useState(1)
  const [auto, setAuto] = useState(false)
  const stickyRef = useRef<HTMLDivElement>(null)
  const markerRefs = useRef<Partial<Record<HotspotId, HTMLButtonElement | null>>>({})
  const readout = useRef<HTMLSpanElement>(null)
  const drag = useDragRotate()

  // Drive marker positions from the projected 3D anchors.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const box = stickyRef.current?.getBoundingClientRect()
      const on = runtime.spots > 0.92 && !!box && Math.abs(box.top) < 4
      for (const d of DETAILS) {
        const el = markerRefs.current[d.id]
        const h = runtime.hotspots[d.id]
        if (!el || !h || !box) continue
        const show = on && h.visible
        el.style.transform = `translate3d(${h.x - box.left}px, ${h.y - box.top}px, 0)`
        el.style.opacity = show ? '1' : '0'
        el.style.pointerEvents = show ? 'auto' : 'none'
        el.tabIndex = show ? 0 : -1
      }
      if (readout.current) {
        const az = ((((runtime.pose.ry * 180) / Math.PI) % 360) + 360) % 360
        const el = (runtime.pose.rx * 180) / Math.PI
        readout.current.textContent = `AZ ${az.toFixed(0).padStart(3, '0')}° · EL ${el >= 0 ? '+' : '−'}${Math.abs(el).toFixed(0).padStart(2, '0')}°`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    runtime.drag.zoom = zoom
  }, [zoom])

  useEffect(() => {
    runtime.drag.auto = auto
    if (auto) runtime.drag.targetX = runtime.drag.targetY = null
  }, [auto])

  const select = (id: HotspotId) => {
    const d = DETAILS.find((x) => x.id === id)!
    setSelected(id)
    setAuto(false)
    const dr = runtime.drag
    const desiredY = d.view.ry - EXPLORE_POSE.ry
    dr.targetY = dr.y + wrap(desiredY - dr.y)
    dr.targetX = d.view.rx - EXPLORE_POSE.rx
    dr.vx = dr.vy = 0
    setZoom(d.view.zoom)
  }

  const reset = () => {
    setSelected(null)
    setAuto(false)
    const dr = runtime.drag
    dr.targetY = dr.y + wrap(0 - dr.y)
    dr.targetX = 0
    setZoom(1)
  }

  const current = DETAILS.find((d) => d.id === selected)

  return (
    <section id="explore" data-scene="explore" className="relative h-[170vh]">
      <div ref={stickyRef} className="sticky top-0 z-[2] h-[100svh] overflow-hidden">
        {/* Drag surface */}
        <div
          {...drag}
          className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
          aria-label="Drag to rotate AETHER ONE"
          role="presentation"
        />

        {/* Concentric guides */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[38, 54, 72].map((s) => (
            <div
              key={s}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.07]"
              style={{ width: `${s}vmin`, height: `${s}vmin` }}
            />
          ))}
        </div>

        {/* Hotspot markers */}
        {DETAILS.map((d, i) => (
          <button
            key={d.id}
            ref={(el) => {
              markerRefs.current[d.id] = el
            }}
            onClick={() => select(d.id)}
            className="group absolute left-0 top-0 -ml-4 -mt-4 grid h-8 w-8 place-items-center opacity-0 transition-opacity duration-300"
            aria-label={`Inspect ${d.name}`}
          >
            <span className="absolute inset-0 rounded-full border border-white/40" style={{ animation: 'pulse-ring 2.4s ease-out infinite', animationDelay: `${i * 0.3}s` }} />
            <span
              className={`relative grid h-6 w-6 place-items-center rounded-full font-mono text-[0.6rem] transition-all duration-300 ${
                selected === d.id ? 'bg-accent text-ink scale-110' : 'bg-white/90 text-ink group-hover:bg-accent'
              }`}
            >
              {i + 1}
            </span>
            <span className="glass-panel pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.7rem] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              {d.name}
            </span>
          </button>
        ))}

        {/* Header */}
        <div className="pointer-events-none relative mx-auto max-w-[1600px] px-5 pt-24 md:px-10 md:pt-28">
          <Eyebrow index="03">Explore</Eyebrow>
          <RevealWords
            as="h2"
            text="Turn it over in your hands."
            italic={[4, 5]}
            className="mt-5 block max-w-[34rem] text-[clamp(2rem,4vw,3.8rem)] font-[300] leading-[1] tracking-[-0.035em]"
          />
          <p className="mono-label mt-5 text-white/40">Drag to rotate · Tap a number to inspect</p>
        </div>

        {/* Detail list */}
        <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-auto md:right-10 md:top-1/2 md:w-[340px] md:-translate-y-1/2">
          <ul className="glass-panel flex gap-1 overflow-x-auto rounded-2xl p-1.5 md:flex-col md:overflow-visible md:p-2" role="listbox" aria-label="Device details">
            {DETAILS.map((d, i) => {
              const on = selected === d.id
              return (
                <li key={d.id} className="shrink-0 md:shrink">
                  <button
                    role="option"
                    aria-selected={on}
                    onClick={() => (on ? reset() : select(d.id))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300 ${
                      on ? 'bg-white/10' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`font-mono text-[0.65rem] ${on ? 'text-accent' : 'text-white/40'}`}>0{i + 1}</span>
                    <span className="whitespace-nowrap text-[0.86rem]">{d.name}</span>
                    <span
                      className={`ml-auto hidden h-1.5 w-1.5 rounded-full transition-all md:block ${on ? 'bg-accent' : 'bg-white/15'}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="hidden overflow-hidden md:block"
                      >
                        <p className="px-3 pb-2 pt-1 text-[0.82rem] leading-relaxed text-white/60">{d.copy}</p>
                        <dl className="grid grid-cols-2 gap-2 px-3 pb-3">
                          {d.stats.map(([k, v]) => (
                            <div key={k} className="rounded-lg border border-white/10 px-2.5 py-2">
                              <dt className="mono-label text-[0.58rem] text-white/40">{k}</dt>
                              <dd className="mt-1 text-[0.8rem]">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
          {/* Mobile description */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.p
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-panel mt-2 rounded-2xl p-3 text-[0.8rem] leading-relaxed text-white/70 md:hidden"
              >
                {current.copy}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute left-5 top-[calc(100%-13rem)] flex flex-col gap-4 md:bottom-10 md:left-10 md:top-auto">
          <div className="hidden items-center gap-3 md:flex">
            <span className="mono-label text-white/40">Zoom</span>
            <input
              type="range"
              className="range w-40"
              min={0.8}
              max={1.6}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ ['--fill' as string]: `${((zoom - 0.8) / 0.8) * 100}%` }}
              aria-label="Zoom"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAuto((a) => !a)}
              aria-pressed={auto}
              className={`rounded-full border px-4 py-2 text-[0.75rem] transition-colors ${
                auto ? 'border-accent bg-accent text-ink' : 'border-white/15 hover:border-white/40'
              }`}
            >
              {auto ? 'Auto-rotate on' : 'Auto-rotate'}
            </button>
            <button onClick={reset} className="rounded-full border border-white/15 px-4 py-2 text-[0.75rem] hover:border-white/40">
              Reset view
            </button>
          </div>
          <span ref={readout} className="mono-label hidden tabular-nums text-white/35 md:block">
            AZ 000° · EL +00°
          </span>
        </div>
      </div>
    </section>
  )
}
