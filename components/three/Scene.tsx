'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Device from './Device'
import { makeDustMaterial } from './shaders'
import { FINISHES } from '@/lib/finishes'
import { getState, useStore } from '@/lib/store'
import { runtime } from '@/lib/runtime'
import { poseAt, BASE_POSE, type Pose } from '@/lib/poses'

const dustPose: Pose = { ...BASE_POSE }

function Dust({ count, depth, speed, size }: { count: number; depth: [number, number]; speed: number; size: number }) {
  const mat = useMemo(() => makeDustMaterial(), [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16
      p[i * 3 + 1] = (Math.random() - 0.5) * 12
      p[i * 3 + 2] = depth[0] + Math.random() * (depth[1] - depth[0])
      s[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1))
    return g
  }, [count, depth])
  const opacity = useRef(1)
  const color = useMemo(() => new THREE.Color(), [])

  useFrame((state, dt) => {
    const u = mat.uniforms
    u.uTime.value = runtime.reducedMotion ? 0 : state.clock.elapsedTime
    u.uScroll.value = (window.scrollY / Math.max(1, window.innerHeight)) * speed
    u.uPixelRatio.value = state.gl.getPixelRatio()
    u.uSize.value = size
    const pose = poseAt(window.scrollY, runtime.isMobile, dustPose)
    opacity.current = THREE.MathUtils.damp(opacity.current, pose.dust, 3, Math.min(dt, 0.05))
    u.uOpacity.value = opacity.current
    color.set(FINISHES[getState().finish].accent)
    u.uColor.value.lerp(color, 1 - Math.exp(-dt * 3))
  })

  return <points geometry={geo} material={mat} frustumCulled={false} />
}

function Lights() {
  const rim = useRef<THREE.SpotLight>(null!)
  const color = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    color.set(FINISHES[getState().finish].accent)
    rim.current.color.lerp(color, 1 - Math.exp(-dt * 3))
  })
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 5, 6]} intensity={1.1} />
      <spotLight ref={rim} position={[-5, 2.5, -4]} angle={0.7} penumbra={1} intensity={90} distance={20} decay={1.6} />
      <spotLight position={[5, -1.5, -3]} angle={0.7} penumbra={1} intensity={45} distance={20} decay={1.6} color="#9fb8ff" />
      <pointLight position={[0, -2.5, 2.5]} intensity={4} distance={8} color="#ffffff" />
    </>
  )
}

function Env() {
  const finish = useStore((s) => s.finish)
  const accent = FINISHES[finish].accent
  return (
    <Environment key={finish} resolution={256} frames={1}>
      <color attach="background" args={['#050507']} />
      <Lightformer form="rect" intensity={3.2} position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[10, 2.2, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[-6, 1, 1.5]} rotation-y={Math.PI / 2} scale={[1.2, 8, 1]} />
      <Lightformer form="rect" intensity={1.8} position={[6, 0.5, 0.5]} rotation-y={-Math.PI / 2} scale={[0.6, 8, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[0, 1.2, 6]} scale={[6, 0.25, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[0, 0.2, 6]} scale={[3, 0.08, 1]} />
      <Lightformer form="ring" color={accent} intensity={2.4} position={[0, 0, -7]} scale={5} />
      <Lightformer form="rect" color={accent} intensity={0.9} position={[0, -4, 2]} rotation-x={-Math.PI / 2} scale={[8, 2, 1]} />
    </Environment>
  )
}

export default function Scene() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 7], fov: 28, near: 0.1, far: 60 }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Env />
        <Device />
        <Dust count={mobile ? 260 : 520} depth={[-7, -2]} speed={0.6} size={1.1} />
        <Dust count={mobile ? 70 : 140} depth={[0.5, 3.5]} speed={1.8} size={1.8} />
      </Suspense>
    </Canvas>
  )
}
