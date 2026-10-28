'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FINISHES } from '@/lib/finishes'
import { setState, useStore } from '@/lib/store'
import { runtime } from '@/lib/runtime'

const STORAGE = [
  { id: '256', label: '256 GB', price: 3499 },
  { id: '512', label: '512 GB', price: 3699 },
  { id: '1tb', label: '1 TB', price: 3999 },
]
const INSERTS = 149
const fmt = (n: number) => `$${n.toLocaleString('en-US')}`

export default function ReserveModal() {
  const open = useStore((s) => s.reserveOpen)
  const finish = useStore((s) => s.finish)
  const [storage, setStorage] = useState('512')
  const [inserts, setInserts] = useState(false)
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [code, setCode] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  const close = () => setState({ reserveOpen: false })
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  const s = STORAGE.find((x) => x.id === storage)!
  const total = s.price + (inserts ? INSERTS : 0)

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement
      runtime.lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
      window.setTimeout(() => panel.current?.querySelector<HTMLElement>('button, input')?.focus(), 400)
    } else {
      runtime.lenis?.start()
      document.documentElement.style.overflow = ''
      restoreFocus.current?.focus?.()
      const t = window.setTimeout(() => {
        setStatus('idle')
        setTouched(false)
      }, 600)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setStatus('sending')
    window.setTimeout(() => {
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
      setCode(`AE1-${rand.slice(0, 4)}-${rand.slice(4)}`)
      setStatus('done')
    }, 1400)
  }

  const f = FINISHES[finish]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={close} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-title"
            data-lenis-prevent
            className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col overflow-y-auto border-l border-white/10 bg-[#0a0a0d]/95 backdrop-blur-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex items-center justify-between px-6 py-5 md:px-8">
              <span className="mono-label text-white/45">Reservation</span>
              <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-white/40" aria-label="Close reservation">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {status !== 'done' ? (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  className="flex flex-1 flex-col px-6 pb-8 md:px-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6 } }}
                  exit={{ opacity: 0, y: -20 }}
                  noValidate
                >
                  <h2 id="reserve-title" className="text-[2.4rem] font-[300] leading-none tracking-[-0.035em]">
                    Reserve <span className="font-serif italic">AETHER ONE</span>
                  </h2>
                  <p className="mt-3 text-[0.9rem] text-white/55">No payment today. Your place in line is held with your email, and you can cancel anytime.</p>

                  <fieldset className="mt-8">
                    <legend className="mono-label mb-3 text-white/45">Finish — {f.name}</legend>
                    <div className="grid grid-cols-4 gap-2">
                      {FINISHES.map((x, i) => (
                        <button
                          type="button"
                          key={x.id}
                          onClick={() => setState({ finish: i })}
                          aria-pressed={i === finish}
                          className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 transition-colors ${
                            i === finish ? 'border-accent bg-white/[0.04]' : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className="h-7 w-7 rounded-full" style={{ background: `radial-gradient(circle at 32% 28%, #fff 0%, ${x.swatch[0]} 22%, ${x.swatch[1]} 78%)` }} />
                          <span className="text-[0.72rem]">{x.name}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-6">
                    <legend className="mono-label mb-3 text-white/45">Storage</legend>
                    <div className="flex flex-col gap-2" role="radiogroup">
                      {STORAGE.map((x) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={storage === x.id}
                          key={x.id}
                          onClick={() => setStorage(x.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                            storage === x.id ? 'border-accent bg-white/[0.04]' : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`grid h-4 w-4 place-items-center rounded-full border ${storage === x.id ? 'border-accent' : 'border-white/30'}`}>
                              {storage === x.id && <span className="h-2 w-2 rounded-full bg-accent" />}
                            </span>
                            {x.label}
                          </span>
                          <span className="font-mono text-[0.85rem] text-white/60">{fmt(x.price)}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={inserts}
                    onClick={() => setInserts((v) => !v)}
                    className="mt-6 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3.5 text-left hover:border-white/25"
                  >
                    <span>
                      <span className="block">Prescription optical inserts</span>
                      <span className="text-[0.78rem] text-white/45">Magnetic, made to your prescription · +{fmt(INSERTS)}</span>
                    </span>
                    <span className={`relative h-6 w-11 rounded-full transition-colors ${inserts ? 'bg-accent' : 'bg-white/15'}`}>
                      <motion.span className="absolute top-1 h-4 w-4 rounded-full bg-white" animate={{ left: inserts ? 24 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                    </span>
                  </button>

                  <label className="mt-6 block">
                    <span className="mono-label mb-3 block text-white/45">Email</span>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder="you@example.com"
                      aria-invalid={touched && !valid}
                      aria-describedby="email-error"
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3.5 outline-none transition-colors placeholder:text-white/25 focus:border-accent"
                    />
                    <span id="email-error" className={`mt-2 block text-[0.78rem] text-[#ff8a7a] transition-opacity ${touched && !valid ? 'opacity-100' : 'opacity-0'}`}>
                      Please enter a valid email address.
                    </span>
                  </label>

                  <div className="mt-auto pt-6">
                    <div className="flex items-baseline justify-between border-t border-white/10 pt-5">
                      <span className="text-white/55">Estimated total</span>
                      <motion.span key={total} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[1.6rem] font-[300] tabular-nums">
                        {fmt(total)}
                      </motion.span>
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="group relative mt-5 w-full overflow-hidden rounded-full bg-bone py-4 text-[0.9rem] font-medium text-ink disabled:opacity-70"
                    >
                      <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0" />
                      <span className="relative">{status === 'sending' ? 'Securing your place…' : 'Place reservation'}</span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="done"
                  className="flex flex-1 flex-col px-6 pb-8 md:px-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative mt-6 grid h-20 w-20 place-items-center rounded-full border border-accent">
                    <span className="absolute inset-0 rounded-full border border-accent" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
                      <motion.path d="M6 14.5l5.5 5.5L22 8.5" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
                    </svg>
                  </div>
                  <h2 id="reserve-title" className="mt-8 text-[2.4rem] font-[300] leading-none tracking-[-0.035em]">
                    You&rsquo;re <span className="font-serif italic">in line.</span>
                  </h2>
                  <p className="mt-3 text-white/55">We&rsquo;ll write to {email} the moment your AETHER ONE is ready to ship.</p>
                  <dl className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10">
                    {[
                      ['Reservation', code],
                      ['Finish', `${f.name} · ${f.material}`],
                      ['Storage', s.label],
                      ['Optical inserts', inserts ? 'Included' : 'Not included'],
                      ['Estimated total', fmt(total)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-3.5">
                        <dt className="mono-label pt-0.5 text-white/45">{k}</dt>
                        <dd className="text-right font-mono text-[0.85rem]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button onClick={close} className="mt-auto w-full rounded-full border border-white/15 py-4 text-[0.9rem] transition-colors hover:border-white/40">
                    Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
