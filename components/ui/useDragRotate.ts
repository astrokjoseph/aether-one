'use client'

import { useRef } from 'react'
import { runtime } from '@/lib/runtime'

/** Pointer handlers that rotate the WebGL device by dragging a DOM surface. */
export function useDragRotate() {
  const last = useRef<{ x: number; y: number; id: number } | null>(null)

  const end = (e: React.PointerEvent<HTMLElement>) => {
    if (last.current?.id !== e.pointerId) return
    last.current = null
    runtime.drag.dragging = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      last.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const d = runtime.drag
      d.dragging = true
      d.targetX = d.targetY = null
      d.vx = d.vy = 0
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const l = last.current
      if (!l || l.id !== e.pointerId) return
      const dx = e.clientX - l.x
      const dy = e.clientY - l.y
      l.x = e.clientX
      l.y = e.clientY
      const d = runtime.drag
      d.y += dx * 0.0085
      d.x += dy * 0.006
      d.vy = dx * 0.0085
      d.vx = dy * 0.006
    },
    onPointerUp: end,
    onPointerCancel: end,
  }
}
