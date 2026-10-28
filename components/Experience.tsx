'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MotionConfig } from 'framer-motion'
import Lenis from 'lenis'
import { runtime } from '@/lib/runtime'
import { measureAnchors } from '@/lib/poses'
import { FINISHES } from '@/lib/finishes'
import { subscribe, getState } from '@/lib/store'
import Preloader from './ui/Preloader'
import Nav from './ui/Nav'
import ReserveModal from './ui/ReserveModal'
import Hero from './sections/Hero'
import Vision from './sections/Vision'
import Design from './sections/Design'
import Explore from './sections/Explore'
import Interface from './sections/Interface'
import Specs from './sections/Specs'
import FinishSection from './sections/Finish'
import Finale from './sections/Finale'

const Scene = dynamic(() => import('./three/Scene'), { ssr: false })

export default function Experience() {
  // Smooth scrolling, viewport flags, anchor measurement and pointer tracking.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    runtime.reducedMotion = mq.matches
    const setMobile = () => {
      runtime.isMobile = window.innerWidth < 768 || window.innerWidth / window.innerHeight < 0.8
    }
    setMobile()

    let lenis: Lenis | null = null
    let raf = 0
    if (!mq.matches) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.4 })
      runtime.lenis = lenis
      if (!getState().introDone) lenis.stop()
      const loop = (t: number) => {
        lenis!.raf(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    const measure = () => {
      setMobile()
      measureAnchors()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    const late = window.setTimeout(measure, 800)

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      runtime.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      runtime.mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const applyAccent = () => {
      document.documentElement.style.setProperty('--accent', FINISHES[getState().finish].accent)
    }
    applyAccent()
    const unsub = subscribe(applyAccent)

    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      runtime.lenis = null
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      window.clearTimeout(late)
      unsub()
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Preloader />
      <Nav />
      <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
        <Scene />
      </div>
      <main className="relative">
        <Hero />
        <Vision />
        <Design />
        <Explore />
        <Interface />
        <Specs />
        <FinishSection />
        <Finale />
      </main>
      <ReserveModal />
      <div className="grain" aria-hidden />
    </MotionConfig>
  )
}
