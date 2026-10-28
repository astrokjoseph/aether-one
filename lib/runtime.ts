import type Lenis from 'lenis'
import type { Anchor } from './poses'

export type HotspotId = 'optics' | 'sensors' | 'crown' | 'band' | 'seal'

/**
 * Mutable, non-reactive state shared between the DOM and the WebGL scene.
 * Read every frame, so it intentionally lives outside React.
 */
export const runtime = {
  anchors: [] as Anchor[],
  mouse: { x: 0, y: 0 },
  drag: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    zoom: 1,
    zoomCur: 1,
    targetX: null as number | null,
    targetY: null as number | null,
    dragging: false,
    auto: false,
  },
  hotspots: {} as Record<HotspotId, { x: number; y: number; visible: boolean }>,
  spots: 0,
  pose: { rx: 0, ry: 0 },
  reducedMotion: false,
  isMobile: false,
  sceneReady: false,
  lenis: null as Lenis | null,
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (runtime.lenis) {
    runtime.lenis.scrollTo(el, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    el.scrollIntoView({ behavior: runtime.reducedMotion ? 'auto' : 'smooth' })
  }
}

export function scrollToTop() {
  if (runtime.lenis) runtime.lenis.scrollTo(0, { duration: 2.2 })
  else window.scrollTo({ top: 0, behavior: runtime.reducedMotion ? 'auto' : 'smooth' })
}
