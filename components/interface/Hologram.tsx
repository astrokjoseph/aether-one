'use client'

import { useEffect, useRef, useState } from 'react'
import { FINISHES } from '@/lib/finishes'
import { useStore } from '@/lib/store'
import { runtime } from '@/lib/runtime'

const SHAPES = [
  { id: 'planet', label: 'Planet', meta: 'Orbital survey · 1:40M' },
  { id: 'genome', label: 'Genome', meta: 'Double helix · 46 chromosomes' },
  { id: 'torus', label: 'Torus', meta: 'Parametric surface · R 0.8' },
  { id: 'terrain', label: 'Terrain', meta: 'Lidar mesh · 2.4 km²' },
] as const
type ShapeId = (typeof SHAPES)[number]['id']

function generate(shape: ShapeId, n: number) {
  const out = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, z = 0
    if (shape === 'planet') {
      if (i < n * 0.78) {
        const yy = 1 - (i / (n * 0.78 - 1)) * 2
        const r = Math.sqrt(1 - yy * yy)
        const th = golden * i
        x = Math.cos(th) * r * 0.82
        y = yy * 0.82
        z = Math.sin(th) * r * 0.82
      } else {
        const a = Math.random() * Math.PI * 2
        const rr = 1.15 + Math.random() * 0.35
        x = Math.cos(a) * rr
        z = Math.sin(a) * rr
        y = (Math.random() - 0.5) * 0.03
        const tilt = 0.4
        const yy = y * Math.cos(tilt) - z * Math.sin(tilt)
        z = y * Math.sin(tilt) + z * Math.cos(tilt)
        y = yy
      }
    } else if (shape === 'genome') {
      const t = (i / n) * Math.PI * 7
      const h = (i / n) * 2 - 1
      if (i % 5 === 0) {
        const f = Math.random()
        x = Math.cos(t) * 0.5 * (1 - 2 * f)
        z = Math.sin(t) * 0.5 * (1 - 2 * f)
      } else {
        const s = i % 2 ? 0 : Math.PI
        x = Math.cos(t + s) * 0.5
        z = Math.sin(t + s) * 0.5
      }
      y = h
    } else if (shape === 'torus') {
      const u = golden * i
      const v = (i / n) * Math.PI * 2 * 21
      x = (0.8 + 0.34 * Math.cos(v)) * Math.cos(u)
      z = (0.8 + 0.34 * Math.cos(v)) * Math.sin(u)
      y = 0.34 * Math.sin(v)
    } else {
      const side = Math.floor(Math.sqrt(n))
      const gx = (i % side) / side
      const gz = Math.floor(i / side) / side
      x = (gx - 0.5) * 2.4
      z = (gz - 0.5) * 2.4
      y = Math.sin(x * 2.4) * Math.cos(z * 2.1) * 0.28 + Math.sin(x * 6 + z * 4) * 0.05 - 0.15
    }
    out[i * 3] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z
  }
  return out
}

export default function Hologram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const [shape, setShape] = useState<ShapeId>('planet')
  const finish = useStore((s) => s.finish)
  const state = useRef({ target: null as Float32Array | null, rotY: 0.6, rotX: 0.25, vel: 0, dragging: false, lastX: 0, lastY: 0, accent: '#ff6b3d' })
  const count = useRef(1500)

  useEffect(() => {
    state.current.accent = FINISHES[finish].accent
  }, [finish])

  useEffect(() => {
    state.current.target = generate(shape, count.current)
  }, [shape])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const mobile = window.innerWidth < 768
    const N = (count.current = mobile ? 900 : 1500)
    const cur = generate('planet', N)
    for (let i = 0; i < cur.length; i++) cur[i] *= 0.01
    state.current.target = generate(shape, N)
    const delay = new Float32Array(N).map(() => Math.random())

    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 32
    let spriteColor = ''
    const paintSprite = (c: string) => {
      const s = sprite.getContext('2d')!
      s.clearRect(0, 0, 32, 32)
      const g = s.createRadialGradient(16, 16, 0, 16, 16, 16)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.18, c)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      s.fillStyle = g
      s.fillRect(0, 0, 32, 32)
      spriteColor = c
    }

    let w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)

    let raf = 0
    let last = performance.now()
    const rm = runtime.reducedMotion
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const st = state.current
      if (spriteColor !== st.accent) paintSprite(st.accent)
      if (!st.dragging) {
        st.rotY += st.vel + (rm ? 0 : dt * 0.25)
        st.vel *= 0.94
      }
      const tgt = st.target!
      for (let i = 0; i < N * 3; i++) {
        const k = rm ? 1 : Math.min(1, dt * (2.2 + delay[(i / 3) | 0] * 3))
        cur[i] += (tgt[i] - cur[i]) * k
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const cy = Math.cos(st.rotY), sy = Math.sin(st.rotY)
      const cx = Math.cos(st.rotX), sx = Math.sin(st.rotX)
      const scale = Math.min(w, h) * 0.34
      const ox = w / 2
      const oy = h * 0.45
      const scan = ((now / 1000) * 0.5) % 2.4 - 1.2
      for (let i = 0; i < N; i++) {
        const x0 = cur[i * 3], y0 = cur[i * 3 + 1], z0 = cur[i * 3 + 2]
        const x1 = x0 * cy - z0 * sy
        const z1 = x0 * sy + z0 * cy
        const y1 = y0 * cx - z1 * sx
        const z2 = y0 * sx + z1 * cx
        const persp = 3.2 / (3.2 + z2)
        const px = ox + x1 * scale * persp
        const py = oy - y1 * scale * persp
        const depth = (1 - z2) * 0.5
        const band = Math.max(0, 1 - Math.abs(y0 - scan) * 6)
        const size = (2.2 + band * 3) * persp * (mobile ? 1.2 : 1.6)
        ctx.globalAlpha = Math.min(1, 0.18 + depth * 0.55 + band * 0.5)
        ctx.drawImage(sprite, px - size, py - size, size * 2, size * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      if (readout.current) {
        const deg = ((((st.rotY * 180) / Math.PI) % 360) + 360) % 360
        readout.current.textContent = `ROT ${deg.toFixed(1).padStart(5, '0')}°`
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const meta = SHAPES.find((s) => s.id === shape)!

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(90% 70% at 50% 100%, #12121a, #060608 70%)' }}>
      {/* Projector cone */}
      <div
        aria-hidden
        className="absolute bottom-[12%] left-1/2 h-[70%] w-[70%] -translate-x-1/2"
        style={{
          clipPath: 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)',
          background: 'linear-gradient(to top, color-mix(in oklab, var(--accent) 30%, transparent), transparent 80%)',
          opacity: 0.35,
          animation: 'flicker 5s infinite',
        }}
      />
      <div aria-hidden className="absolute bottom-[10%] left-1/2 h-[5%] w-[22%] -translate-x-1/2 rounded-[50%] border border-white/15" style={{ boxShadow: '0 0 40px 4px color-mix(in oklab, var(--accent) 50%, transparent), inset 0 0 20px color-mix(in oklab, var(--accent) 60%, transparent)' }} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ animation: 'flicker 7s infinite' }}
        aria-label={`Interactive hologram: ${meta.label}. Drag to rotate.`}
        role="img"
        onPointerDown={(e) => {
          const st = state.current
          st.dragging = true
          st.lastX = e.clientX
          st.lastY = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const st = state.current
          if (!st.dragging) return
          const dx = e.clientX - st.lastX
          const dy = e.clientY - st.lastY
          st.lastX = e.clientX
          st.lastY = e.clientY
          st.rotY += dx * 0.008
          st.vel = dx * 0.008
          st.rotX = Math.max(-1, Math.min(1, st.rotX + dy * 0.005))
        }}
        onPointerUp={() => (state.current.dragging = false)}
        onPointerCancel={() => (state.current.dragging = false)}
      />
      {/* Scanlines */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)' }} />

      {/* HUD */}
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5 md:left-6 md:top-6">
        <span className="mono-label text-accent">Model · {meta.label}</span>
        <span className="mono-label text-white/40">{meta.meta}</span>
        <span ref={readout} className="mono-label tabular-nums text-white/40">ROT 000.0°</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 hidden text-right md:right-6 md:top-6 md:block">
        <span className="mono-label block text-white/40">Volumetric · 1.5k points</span>
        <span className="mono-label block text-white/40">Drag to rotate</span>
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center px-3 md:bottom-6">
        <div className="glass-panel flex gap-1 rounded-full p-1" role="radiogroup" aria-label="Hologram model">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={shape === s.id}
              onClick={() => setShape(s.id)}
              className={`rounded-full px-3 py-2 text-[0.72rem] transition-colors duration-300 md:px-4 ${
                shape === s.id ? 'bg-bone text-ink' : 'text-white/70 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
