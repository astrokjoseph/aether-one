import * as THREE from 'three'

/**
 * Procedural geometry for AETHER ONE. Everything is generated at runtime:
 * a warped superellipse outline is swept into soft "pebble" solids and then
 * bent around a cylinder so the visor wraps the face.
 */

export const BEND_RADIUS = 2.1

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

export function bendPoint(x: number, y: number, z: number, R = BEND_RADIUS, out = new THREE.Vector3()) {
  const th = x / R
  const r = R + z
  return out.set(Math.sin(th) * r, y, Math.cos(th) * r - R)
}

function superPoint(t: number, a: number, b: number, n: number): [number, number] {
  const c = Math.cos(t)
  const s = Math.sin(t)
  const e = 2 / n
  return [a * Math.sign(c) * Math.pow(Math.abs(c), e), b * Math.sign(s) * Math.pow(Math.abs(s), e)]
}

export type OutlineOpts = {
  a: number
  b: number
  n: number
  nose?: number
  noseW?: number
  taper?: number
  segments: number
}

export type Outline = { points: THREE.Vector2[]; normals: THREE.Vector2[]; opts: OutlineOpts }

export function warpPoint(x: number, y: number, o: OutlineOpts): [number, number] {
  const { a, b, nose = 0, noseW = 0.3, taper = 0 } = o
  let yy = y * (1 - taper * (x / a) * (x / a))
  if (nose) {
    const g = Math.exp(-(x * x) / (noseW * noseW))
    yy += nose * g * smoothstep(-b * 0.15, -b, yy)
  }
  return [x, yy]
}

/** Arc-length resampled, warped superellipse with outward normals (CCW). */
export function makeOutline(o: OutlineOpts): Outline {
  const N = 2400
  const pts: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const [x, y] = superPoint((i / N) * Math.PI * 2, o.a, o.b, o.n)
    pts.push(warpPoint(x, y, o))
  }
  const L = [0]
  for (let i = 1; i <= N; i++) {
    const p = pts[i - 1]
    const q = pts[i % N]
    L.push(L[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1]))
  }
  const total = L[N]
  const points: THREE.Vector2[] = []
  let j = 0
  for (let k = 0; k < o.segments; k++) {
    const target = (k / o.segments) * total
    while (L[j + 1] < target) j++
    const f = (target - L[j]) / (L[j + 1] - L[j] || 1)
    const p = pts[j]
    const q = pts[(j + 1) % N]
    points.push(new THREE.Vector2(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f))
  }
  const normals = points.map((_, k) => {
    const prev = points[(k - 1 + points.length) % points.length]
    const next = points[(k + 1) % points.length]
    const tx = next.x - prev.x
    const ty = next.y - prev.y
    return new THREE.Vector2(ty, -tx).normalize()
  })
  return { points, normals, opts: o }
}

export type PebbleOpts = {
  outline: Outline
  rB: number
  z?: number
  dome?: number
  faceRings?: number
  bevelSegs?: number
  faceOnly?: boolean
  faceScale?: number
  R?: number
}

/**
 * Sweeps an outline into a closed, rounded solid (front face, a half-round
 * bevel and back face), then bends it. Adds a planar `planar` uv and a
 * `front` mask attribute used by the display shaders.
 */
export function makePebble(o: PebbleOpts) {
  const { outline, rB, z = 0, dome = 0, faceRings = 14, bevelSegs = 16, faceOnly = false, faceScale = 1, R = BEND_RADIUS } = o
  const { a, b } = outline.opts
  const cols = outline.points.length
  const rows: { s: number; off: number; z: number; front: number }[] = []
  const ring = (f: number) => 1 - (1 - f) * (1 - f)

  for (let k = 0; k <= faceRings; k++) {
    const s = ring(k / faceRings) * faceScale
    rows.push({ s, off: 0, z: rB + dome * (1 - s * s), front: 1 })
  }
  if (!faceOnly) {
    for (let j = 1; j < bevelSegs; j++) {
      const al = (j / bevelSegs) * Math.PI
      rows.push({ s: 1, off: rB * Math.sin(al), z: rB * Math.cos(al), front: 0 })
    }
    for (let k = faceRings; k >= 0; k--) {
      const s = ring(k / faceRings)
      rows.push({ s, off: 0, z: -rB - dome * 0.4 * (1 - s * s), front: 0 })
    }
  }

  const pos = new Float32Array(rows.length * cols * 3)
  const planar = new Float32Array(rows.length * cols * 2)
  const front = new Float32Array(rows.length * cols)
  const v = new THREE.Vector3()
  rows.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const P = outline.points[c]
      const N = outline.normals[c]
      const qx = P.x - N.x * rB
      const qy = P.y - N.y * rB
      const x = qx * row.s + N.x * row.off
      const y = qy * row.s + N.y * row.off
      bendPoint(x, y, z + row.z, R, v)
      const i = r * cols + c
      pos.set([v.x, v.y, v.z], i * 3)
      planar.set([x / (2 * a) + 0.5, y / (2 * b) + 0.5], i * 2)
      front[i] = row.front
    }
  })

  const index: number[] = []
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const i0 = r * cols + c
      const i1 = r * cols + ((c + 1) % cols)
      const i2 = (r + 1) * cols + c
      const i3 = (r + 1) * cols + ((c + 1) % cols)
      index.push(i0, i2, i1, i1, i2, i3)
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('planar', new THREE.BufferAttribute(planar, 2))
  g.setAttribute('uv', new THREE.BufferAttribute(planar.slice(), 2))
  g.setAttribute('front', new THREE.BufferAttribute(front, 1))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** Sweeps a rounded-rectangle section along a curve (bands, light lines). */
export function makeSweep(
  curve: THREE.Curve<THREE.Vector3>,
  opts: {
    steps: number
    segs?: number
    n?: number
    closed?: boolean
    section: (t: number) => { w: number; h: number }
    up?: THREE.Vector3
    uvRepeat?: number
  },
) {
  const { steps, segs = 24, n = 4, closed = false, section, up = new THREE.Vector3(0, 1, 0), uvRepeat = 1 } = opts
  const rowsCount = closed ? steps : steps + 1
  const pos = new Float32Array(rowsCount * segs * 3)
  const uv = new Float32Array(rowsCount * segs * 2)
  const P = new THREE.Vector3()
  const T = new THREE.Vector3()
  const side = new THREE.Vector3()
  const upv = new THREE.Vector3()
  for (let i = 0; i < rowsCount; i++) {
    const t = i / steps
    curve.getPointAt(Math.min(t, 1), P)
    curve.getTangentAt(Math.min(t, 1), T)
    side.crossVectors(T, up).normalize()
    upv.crossVectors(side, T).normalize()
    const { w, h } = section(t)
    for (let j = 0; j < segs; j++) {
      const [sx, sy] = superPoint((j / segs) * Math.PI * 2, w / 2, h / 2, n)
      const k = i * segs + j
      pos[k * 3] = P.x + side.x * sx + upv.x * sy
      pos[k * 3 + 1] = P.y + side.y * sx + upv.y * sy
      pos[k * 3 + 2] = P.z + side.z * sx + upv.z * sy
      uv[k * 2] = t * uvRepeat
      uv[k * 2 + 1] = j / segs
    }
  }
  const index: number[] = []
  const rowPairs = closed ? rowsCount : rowsCount - 1
  for (let i = 0; i < rowPairs; i++) {
    const i2r = (i + 1) % rowsCount
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs
      const a = i * segs + j
      const b = i * segs + j1
      const c = i2r * segs + j
      const d = i2r * segs + j1
      index.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** Cylinder with a knurled (ridged) side, for the digital crown. */
export function makeKnurledCylinder(radius: number, height: number, ridges = 64) {
  const g = new THREE.CylinderGeometry(radius, radius, height, ridges, 1, false)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const torso = 2 * (ridges + 1)
  for (let i = 0; i < torso; i++) {
    const ix = i % (ridges + 1)
    if (ix % 2 === 0) {
      const x = p.getX(i)
      const zz = p.getZ(i)
      const k = (radius + 0.004) / radius
      p.setXYZ(i, x * k, p.getY(i), zz * k)
    }
  }
  g.computeVertexNormals()
  return g
}

/** A generated knit-fabric texture (used as colour + bump). */
export function makeKnitTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#8c8c8c'
  ctx.fillRect(0, 0, size, size)
  const step = 8
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const g = ctx.createLinearGradient(x, y, x + step, y + step)
      g.addColorStop(0, '#f4f4f4')
      g.addColorStop(1, '#c9c9c9')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x + 0.5, y + 0.5)
      ctx.lineTo(x + step / 2, y + step - 1)
      ctx.lineTo(x + step / 2 - 1.2, y + step - 0.5)
      ctx.lineTo(x - 0.4, y + 1.5)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x + step - 0.5, y + 0.5)
      ctx.lineTo(x + step / 2, y + step - 1)
      ctx.lineTo(x + step / 2 + 1.2, y + step - 0.5)
      ctx.lineTo(x + step + 0.4, y + 1.5)
      ctx.closePath()
      ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
