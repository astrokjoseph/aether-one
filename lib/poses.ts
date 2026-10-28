import { runtime } from './runtime'

/** Every animatable channel of the device's choreography. */
export type Pose = {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  s: number
  explode: number
  glow: number
  interact: number
  spin: number
  dust: number
  spots: number
}

export const POSE_KEYS = [
  'x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'explode', 'glow', 'interact', 'spin', 'dust', 'spots',
] as const

export const BASE_POSE: Pose = {
  x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, explode: 0, glow: 0, interact: 0, spin: 0, dust: 1, spots: 0,
}

export const INTRO_POSE: Pose = { ...BASE_POSE, y: -0.6, z: -9, rx: -0.5, ry: 2.8, s: 0.5 }

type Key = { at: number; d: Partial<Pose>; m?: Partial<Pose> }

export const EXPLORE_POSE = { rx: 0.12, ry: -0.45 }

/**
 * Keyframes per [data-scene] section. `at` is the progress through the
 * section's scrollable distance (0 = section top at viewport top).
 * `d` is desktop, `m` overrides for portrait / mobile.
 */
export const SCENE_KEYS: Record<string, Key[]> = {
  hero: [{ at: 0, d: { y: -0.16, rx: 0.14, ry: -0.6, s: 1.05, spin: 1, glow: 0.35 }, m: { y: 0.55, s: 1.15 } }],
  vision: [
    { at: 0, d: { x: 1.45, y: -0.02, rx: 0.1, ry: -1.3, s: 0.8, spin: 0.5 }, m: { x: 0, y: 0.92, s: 0.82 } },
    { at: 1, d: { x: 1.45, y: 0.04, rx: 0.2, ry: -0.35, s: 0.84, spin: 0.5 }, m: { x: 0, y: 0.92, s: 0.82 } },
  ],
  design: [
    { at: 0.03, d: { x: 1.3, rx: 0.06, ry: -1.5, s: 0.92 }, m: { x: 0, y: 0.95, s: 0.85 } },
    { at: 0.26, d: { x: 1.3, rx: 0.12, ry: -1.05, s: 0.96 }, m: { x: 0, y: 0.95, s: 0.85 } },
    { at: 0.42, d: { x: 0.62, rx: 0.34, ry: -1.18, s: 0.7, explode: 1 }, m: { x: 0, y: 0.9, s: 0.62, ry: -1.0 } },
    { at: 0.58, d: { x: 0.62, rx: 0.3, ry: -0.92, s: 0.7, explode: 1 }, m: { x: 0, y: 0.9, s: 0.62, ry: -0.8 } },
    { at: 0.74, d: { x: 1.2, rx: -0.14, ry: -0.08, s: 1.0, glow: 1 }, m: { x: 0, y: 0.95, s: 0.9 } },
    { at: 0.97, d: { x: 1.2, rx: -0.08, ry: 0.12, s: 1.0, glow: 1 }, m: { x: 0, y: 0.95, s: 0.9 } },
  ],
  explore: [
    { at: 0, d: { x: -0.32, y: -0.08, ...EXPLORE_POSE, s: 0.98, interact: 1, spots: 1 }, m: { x: 0, y: 0.15, s: 1.1 } },
    { at: 1, d: { x: -0.32, y: -0.08, ...EXPLORE_POSE, s: 0.98, interact: 1, spots: 1 }, m: { x: 0, y: 0.15, s: 1.1 } },
  ],
  interface: [{ at: 0, d: { y: 3.8, rx: 0.8, ry: 1.2, s: 0.55, dust: 0.3 } }],
  specs: [
    { at: 0, d: { y: 3.8, ry: 2, s: 0.55, dust: 0.3 } },
    { at: 1, d: { y: -3.8, ry: -2.2, s: 0.55, dust: 0.6 } },
  ],
  finish: [
    { at: 0, d: { y: 0.02, rx: 0.12, ry: -0.5, s: 1.0, interact: 1, spin: 1.8, glow: 0.4 }, m: { y: 0.12, s: 1.08 } },
    { at: 1, d: { y: 0.02, rx: 0.12, ry: -0.5, s: 1.0, interact: 1, spin: 1.8, glow: 0.4 }, m: { y: 0.12, s: 1.08 } },
  ],
  finale: [
    { at: 0, d: { y: 0, rx: 0, ry: 0, s: 0.95, glow: 0.6 } },
    { at: 0.6, d: { y: 1.02, rx: 0.36, ry: 0, s: 0.6, glow: 1 }, m: { y: 1.0, s: 0.75 } },
  ],
}

export type Anchor = { y: number; d: Pose; m: Pose }

export function measureAnchors() {
  const vh = window.innerHeight
  const list: Anchor[] = []
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
    const keys = SCENE_KEYS[el.dataset.scene ?? '']
    if (!keys) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = Math.max(0, el.offsetHeight - vh)
    for (const k of keys) {
      const d = { ...BASE_POSE, ...k.d }
      list.push({ y: top + k.at * span, d, m: { ...d, ...k.m } })
    }
  })
  list.sort((a, b) => a.y - b.y)
  runtime.anchors = list
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function poseAt(scroll: number, mobile: boolean, out: Pose): Pose {
  const a = runtime.anchors
  if (!a.length) return Object.assign(out, BASE_POSE)
  const pick = (k: Anchor) => (mobile ? k.m : k.d)
  if (scroll <= a[0].y) return Object.assign(out, pick(a[0]))
  if (scroll >= a[a.length - 1].y) return Object.assign(out, pick(a[a.length - 1]))
  let i = 0
  while (i < a.length - 2 && scroll > a[i + 1].y) i++
  const p0 = pick(a[i])
  const p1 = pick(a[i + 1])
  const span = a[i + 1].y - a[i].y
  const t = span <= 0 ? 1 : ease(Math.min(1, Math.max(0, (scroll - a[i].y) / span)))
  for (const k of POSE_KEYS) out[k] = p0[k] + (p1[k] - p0[k]) * t
  return out
}
