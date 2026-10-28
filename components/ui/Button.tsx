'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Magnetic from './Magnetic'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  icon?: ReactNode
  magnetic?: boolean
}

/** Pill button with a sliding light fill and magnetic pull. */
export default function Button({ variant = 'primary', icon, magnetic = true, className = '', children, ...rest }: Props) {
  const base =
    'group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-6 py-3.5 text-[0.82rem] font-medium tracking-[0.02em] transition-[color,box-shadow,transform] duration-500 ease-[var(--ease-expo)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-bone text-ink hover:text-ink accent-glow'
      : 'border border-white/15 text-bone hover:border-white/40'
  const btn = (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      <span
        aria-hidden
        className={`absolute inset-0 origin-bottom scale-y-0 rounded-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100 ${
          variant === 'primary' ? 'bg-accent' : 'bg-white/10'
        }`}
      />
      <span className="relative z-10">{children}</span>
      {icon && (
        <span className="relative z-10 grid h-5 w-5 place-items-center transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </button>
  )
  return magnetic ? <Magnetic strength={0.25}>{btn}</Magnetic> : btn
}

export const Arrow = ({ dir = 'right' }: { dir?: 'right' | 'down' | 'up' }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{ transform: dir === 'down' ? 'rotate(90deg)' : dir === 'up' ? 'rotate(-90deg)' : undefined }}
    aria-hidden
  >
    <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
