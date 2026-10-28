'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { runtime, scrollToId, scrollToTop } from '@/lib/runtime'
import { setState, useStore } from '@/lib/store'
import Magnetic from './Magnetic'

export const SECTIONS = [
  { id: 'vision', label: 'Vision' },
  { id: 'design', label: 'Design' },
  { id: 'explore', label: 'Explore' },
  { id: 'interface', label: 'Interface' },
  { id: 'specs', label: 'Specs' },
  { id: 'finish', label: 'Finish' },
]

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="8.5" width="27" height="15" rx="7.5" fill="none" stroke="url(#lg-logo)" strokeWidth="1.4" />
      <path d="M10 20.5 16 11l6 9.5" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export default function Nav() {
  const intro = useStore((s) => s.introDone)
  const active = useStore((s) => s.activeSection)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section tracking.
  useEffect(() => {
    const els = ['overview', ...SECTIONS.map((s) => s.id), 'reserve']
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setState({ activeSection: e.target.id })
        })
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (open) runtime.lenis?.stop()
    else runtime.lenis?.start()
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    window.setTimeout(() => scrollToId(id), open ? 350 : 0)
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={intro ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
      >
        <div
          className={`absolute inset-0 transition-all duration-700 ${
            scrolled ? 'bg-ink/55 backdrop-blur-xl' : 'bg-transparent'
          }`}
          style={{ maskImage: 'linear-gradient(#000 70%, transparent)' }}
        />
        <nav className="relative mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 md:px-10" aria-label="Primary">
          <button onClick={scrollToTop} className="group flex items-center gap-3" aria-label="AETHER ONE — back to top">
            <Logo className="h-7 w-7 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-[180deg]" />
            <span className="text-[0.78rem] font-medium tracking-[0.42em]">AETHER</span>
          </button>

          <ul className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md lg:flex">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => go(s.id)}
                  className={`relative rounded-full px-4 py-2 text-[0.78rem] tracking-wide transition-colors duration-300 ${
                    active === s.id ? 'text-ink' : 'text-white/60 hover:text-white'
                  }`}
                  aria-current={active === s.id ? 'true' : undefined}
                >
                  {active === s.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-bone"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Magnetic>
              <button
                onClick={() => setState({ reserveOpen: true })}
                className="group relative overflow-hidden rounded-full bg-bone px-5 py-2.5 text-[0.78rem] font-medium text-ink"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-accent transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0" />
                <span className="relative">Reserve</span>
              </button>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <span className={`absolute h-px w-4 bg-white transition-transform duration-500 ${open ? 'rotate-45' : '-translate-y-[3px]'}`} />
              <span className={`absolute h-px w-4 bg-white transition-transform duration-500 ${open ? '-rotate-45' : 'translate-y-[3px]'}`} />
            </button>
          </div>
        </nav>
        <motion.div className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent/80" style={{ scaleX: progress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end bg-ink/95 px-6 pb-12 pt-24 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 36px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((s, i) => (
                <li key={s.id} className="overflow-hidden">
                  <motion.button
                    onClick={() => go(s.id)}
                    className="flex w-full items-baseline gap-4 py-2 text-left text-[2.6rem] font-light tracking-[-0.03em]"
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.05 }}
                  >
                    <span className="font-mono text-xs text-accent">0{i + 1}</span>
                    {s.label}
                  </motion.button>
                </li>
              ))}
            </ul>
            <p className="mono-label mt-10 text-white/40">AETHER ONE · Ships Spring 2027</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
