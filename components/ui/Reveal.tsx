'use client'

import { motion, type MotionValue } from 'framer-motion'
import { useRange } from '@/lib/motion'
import type { ElementType, ReactNode } from 'react'

/**
 * Masked, staggered word reveal. Words slide up from behind a clip mask.
 * Triggered once on entering the viewport (or immediately with `play`).
 */
export function RevealWords({
  text,
  className = '',
  as: Tag = 'span',
  delay = 0,
  stagger = 0.06,
  play,
  italic = [],
}: {
  text: string
  className?: string
  as?: ElementType
  delay?: number
  stagger?: number
  play?: boolean
  italic?: number[]
}) {
  const words = text.split(' ')
  const trigger = play === undefined ? { whileInView: 'show', viewport: { once: true, margin: '-12% 0px' } } : { animate: play ? 'show' : 'hide' }
  return (
    <Tag className={className} aria-label={text}>
      <motion.span className="inline" initial="hide" {...trigger} aria-hidden>
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-top -mb-[0.12em]">
            <motion.span
              className={`inline-block ${italic.includes(i) ? 'font-serif italic font-normal tracking-normal' : ''}`}
              variants={{
                hide: { y: '115%', rotate: 4 },
                show: { y: '0%', rotate: 0, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: delay + i * stagger } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/** A word whose brightness is scrubbed by a scroll progress range. */
export function ScrubWord({
  progress,
  range,
  children,
  className = '',
}: {
  progress: MotionValue<number>
  range: [number, number]
  children: ReactNode
  className?: string
}) {
  const opacity = useRange(progress, range, [0.13, 1])
  const blur = useRange(progress, range, ['blur(6px)', 'blur(0px)'])
  const y = useRange(progress, range, ['0.25em', '0em'])
  return (
    <motion.span className={`inline-block ${className}`} style={{ opacity, filter: blur, y }}>
      {children}
    </motion.span>
  )
}

export function Eyebrow({ index, children, className = '' }: { index: string; children: ReactNode; className?: string }) {
  return (
    <div className={`mono-label flex items-center gap-3 text-white/50 ${className}`}>
      <span className="text-accent">{index}</span>
      <span className="h-px w-8 bg-white/25" />
      <span>{children}</span>
    </div>
  )
}
