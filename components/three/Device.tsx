'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BEND_RADIUS,
  bendPoint,
  makeKnitTexture,
  makeKnurledCylinder,
  makeOutline,
  makePebble,
  makeSweep,
  warpPoint,
  type OutlineOpts,
} from './geometry'
import { makeDisplayMaterial, makeGlowMaterial, patchGlass, type DisplayUniforms } from './shaders'
import { FINISHES } from '@/lib/finishes'
import { getState } from '@/lib/store'
import { runtime, type HotspotId } from '@/lib/runtime'
import { BASE_POSE, INTRO_POSE, POSE_KEYS, poseAt, type Pose } from '@/lib/poses'

const R = BEND_RADIUS
const SHELL: OutlineOpts = { a: 1.26, b: 0.58, n: 3.4, nose: 0.15, noseW: 0.3, taper: 0.12, segments: 180 }
const GLASS: OutlineOpts = { ...SHELL, a: 1.212, b: 0.535 }
const SEAL: OutlineOpts = { ...SHELL, a: 1.1, b: 0.47, nose: 0.13 }
const GLASS_Z = 0.118
const GLASS_RB = 0.055

const SENSORS: [number, number, number][] = [
  [-0.3, -0.33, 0.034],
  [0.3, -0.33, 0.034],
  [-0.66, -0.27, 0.03],
  [0.66, -0.27, 0.03],
]

/** Surface height of the domed glass at a flat (x, y). */
function glassSurfaceZ(x: number, y: number) {
  const a = GLASS.a - GLASS_RB
  const b = GLASS.b - GLASS_RB
  const s = Math.min(1, Math.pow(Math.pow(Math.abs(x / a), GLASS.n) + Math.pow(Math.abs(y / b), GLASS.n), 1 / GLASS.n))
  return GLASS_Z + GLASS_RB + 0.03 * (1 - s * s)
}

const damp = THREE.MathUtils.damp
const tmpPose: Pose = { ...BASE_POSE }

export default function Device() {
  const { camera } = useThree()
  const root = useRef<THREE.Group>(null!)
  const float = useRef<THREE.Group>(null!)
  const glassG = useRef<THREE.Group>(null!)
  const displayG = useRef<THREE.Group>(null!)
  const lensG = useRef<THREE.Group>(null!)
  const sealG = useRef<THREE.Group>(null!)
  const bandG = useRef<THREE.Group>(null!)
  const crownG = useRef<THREE.Group>(null!)
  const crownSpin = useRef<THREE.Mesh>(null!)
  const buttonG = useRef<THREE.Group>(null!)
  const sensorG = useRef<THREE.Group>(null!)
  const glow = useRef<THREE.Mesh>(null!)
  const anchors = useRef<Partial<Record<HotspotId, THREE.Object3D | null>>>({})

  const cur = useRef<Pose>({ ...INTRO_POSE })
  const introAt = useRef<number | null>(null)

  const geo = useMemo(() => {
    const shellOutline = makeOutline(SHELL)
    const shell = makePebble({ outline: shellOutline, rB: 0.15, faceRings: 10, bevelSegs: 20 })
    const glass = makePebble({ outline: makeOutline(GLASS), rB: GLASS_RB, z: GLASS_Z, dome: 0.03, faceRings: 18, bevelSegs: 12 })
    const display = makePebble({ outline: makeOutline(GLASS), rB: 0, z: GLASS_Z - 0.02, faceOnly: true, faceScale: 0.94, faceRings: 12 })
    const seal = makePebble({ outline: makeOutline(SEAL), rB: 0.11, z: -0.22, faceRings: 8, bevelSegs: 14 })

    // Halo light line around the equator of the frame.
    const v = new THREE.Vector3()
    const haloPts = shellOutline.points.map((p, i) => {
      const n = shellOutline.normals[i]
      return bendPoint(p.x + n.x * 0.004, p.y + n.y * 0.004, 0, R, v).clone()
    })
    const halo = makeSweep(new THREE.CatmullRomCurve3(haloPts, true, 'centripetal'), {
      steps: 360,
      segs: 8,
      n: 2,
      closed: true,
      section: () => ({ w: 0.014, h: 0.014 }),
      up: new THREE.Vector3(0, 0, 1),
    })

    // Halo band wrapping behind the head.
    const bandCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1.17, 0, -0.6),
        new THREE.Vector3(-1.27, 0, -1.05),
        new THREE.Vector3(-1.12, 0, -1.68),
        new THREE.Vector3(-0.62, 0, -2.08),
        new THREE.Vector3(0, 0, -2.2),
        new THREE.Vector3(0.62, 0, -2.08),
        new THREE.Vector3(1.12, 0, -1.68),
        new THREE.Vector3(1.27, 0, -1.05),
        new THREE.Vector3(1.17, 0, -0.6),
      ],
      false,
      'centripetal',
    )
    const band = makeSweep(bandCurve, {
      steps: 220,
      segs: 28,
      n: 4,
      section: (t) => ({ w: 0.07, h: 0.2 + 0.2 * Math.sin(t * Math.PI) }),
      uvRepeat: 36,
    })
    const pod = new THREE.CapsuleGeometry(0.078, 0.3, 8, 28)
    pod.rotateX(Math.PI / 2)
    const podGrille = new THREE.CapsuleGeometry(0.03, 0.17, 6, 16)
    podGrille.rotateX(Math.PI / 2)
    podGrille.scale(0.5, 1, 1)
    const crown = makeKnurledCylinder(0.072, 0.075, 72)
    const crownCap = new THREE.CylinderGeometry(0.066, 0.066, 0.004, 48)
    const button = new THREE.CapsuleGeometry(0.026, 0.2, 6, 16)
    button.rotateZ(Math.PI / 2)
    const sensorRing = new THREE.CylinderGeometry(1, 1, 0.012, 36)
    sensorRing.rotateX(Math.PI / 2)
    const sensorLens = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
    sensorLens.rotateX(Math.PI / 2)
    const lensRing = new THREE.TorusGeometry(0.29, 0.03, 20, 72)
    const lens = new THREE.SphereGeometry(0.3, 48, 24, 0, Math.PI * 2, 0, 0.55)
    lens.rotateX(Math.PI / 2)
    lens.translate(0, 0, -0.25)
    const chip = new THREE.BoxGeometry(0.5, 0.22, 0.03)
    const glowPlane = new THREE.PlaneGeometry(5, 5)
    glowPlane.rotateX(-Math.PI / 2)
    return { shell, glass, display, seal, halo, band, pod, podGrille, crown, crownCap, button, sensorRing, sensorLens, lensRing, lens, chip, glowPlane }
  }, [])

  const uniforms = useMemo<DisplayUniforms>(
    () => ({ uTime: { value: 0 }, uAccent: { value: new THREE.Color(FINISHES[0].accent) }, uDisplay: { value: 0.4 } }),
    [],
  )
  const displayUniforms = useMemo<DisplayUniforms>(
    () => ({ uTime: uniforms.uTime, uAccent: uniforms.uAccent, uDisplay: { value: 1 } }),
    [uniforms],
  )

  const mats = useMemo(() => {
    const f = FINISHES[0]
    const knit = makeKnitTexture()
    knit.repeat.set(1, 3)
    const sealKnit = knit.clone()
    sealKnit.repeat.set(14, 2)
    sealKnit.needsUpdate = true
    const frame = new THREE.MeshPhysicalMaterial({
      color: f.frame,
      metalness: 1,
      roughness: f.frameRoughness,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
    })
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#020204',
      metalness: 0.25,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.4,
      emissive: '#000000',
    })
    patchGlass(glass, uniforms)
    const display = makeDisplayMaterial(displayUniforms)
    const band = new THREE.MeshStandardMaterial({ color: f.band, roughness: 0.92, metalness: 0, map: knit, bumpMap: knit, bumpScale: 3 })
    const seal = new THREE.MeshStandardMaterial({ color: f.seal, roughness: 1, metalness: 0, map: sealKnit, bumpMap: sealKnit, bumpScale: 2 })
    const dark = new THREE.MeshPhysicalMaterial({ color: '#0b0b0e', metalness: 0.6, roughness: 0.35, envMapIntensity: 1 })
    const lensGlass = new THREE.MeshPhysicalMaterial({
      color: '#0a0c12',
      metalness: 0,
      roughness: 0.02,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [200, 600],
      envMapIntensity: 2.2,
    })
    const halo = new THREE.MeshBasicMaterial({ color: f.accent, toneMapped: false })
    const sensorDot = new THREE.MeshBasicMaterial({ color: f.accent, toneMapped: false, transparent: true, opacity: 0.2 })
    const chip = new THREE.MeshPhysicalMaterial({ color: '#16181d', metalness: 0.8, roughness: 0.25, emissive: f.accent, emissiveIntensity: 0.2 })
    const floor = makeGlowMaterial()
    return { frame, glass, display, band, seal, dark, lensGlass, halo, sensorDot, chip, floor, knit, sealKnit }
  }, [uniforms, displayUniforms])

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(mats).forEach((m) => m.dispose())
    },
    [geo, mats],
  )

  const sensors = useMemo(
    () =>
      SENSORS.map(([x, y, r]) => {
        const p = bendPoint(x, y, glassSurfaceZ(x, y) + 0.002)
        return { p, r, ry: x / R }
      }),
    [],
  )

  const top = (x: number) => warpPoint(x, SHELL.b, SHELL)[1]
  const crownPos = bendPoint(0.86, top(0.86) + 0.02, -0.02)
  const buttonPos = bendPoint(-0.84, top(-0.84) + 0.012, -0.02)

  const targetColors = useMemo(
    () => ({ frame: new THREE.Color(), band: new THREE.Color(), seal: new THREE.Color(), accent: new THREE.Color() }),
    [],
  )
  const v = useMemo(() => new THREE.Vector3(), [])
  const n = useMemo(() => new THREE.Vector3(), [])
  const toCam = useMemo(() => new THREE.Vector3(), [])

  const HOTSPOT_NORMALS: Record<HotspotId, THREE.Vector3> = useMemo(
    () => ({
      optics: new THREE.Vector3(0, 0, 1),
      sensors: new THREE.Vector3(0.1, -0.3, 1).normalize(),
      crown: new THREE.Vector3(0.2, 1, 0.35).normalize(),
      band: new THREE.Vector3(-1, 0, -0.2).normalize(),
      seal: new THREE.Vector3(0, 0, -1),
    }),
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    const rm = runtime.reducedMotion
    runtime.sceneReady = true

    // ---- target pose from scroll choreography
    const intro = getState().introDone
    if (intro && introAt.current === null) introAt.current = t
    const target = intro ? poseAt(window.scrollY, runtime.isMobile, tmpPose) : INTRO_POSE
    const settling = introAt.current !== null && t - introAt.current < 2.6
    const lambda = rm ? 14 : settling ? 1.9 : 3.4
    const c = cur.current
    if (rm && intro && introAt.current === t) Object.assign(c, target)
    for (const k of POSE_KEYS) c[k] = damp(c[k], target[k], k === 'explode' ? lambda * 0.8 : lambda, dt)

    // ---- direct manipulation (drag / hotspots / auto-rotate)
    const d = runtime.drag
    if (!d.dragging) {
      if (d.targetY !== null && d.targetX !== null) {
        d.y = damp(d.y, d.targetY, 4.5, dt)
        d.x = damp(d.x, d.targetX, 4.5, dt)
        if (Math.abs(d.y - d.targetY) < 0.002 && Math.abs(d.x - d.targetX) < 0.002) d.targetX = d.targetY = null
      } else {
        d.y += d.vy * dt * 60
        d.x += d.vx * dt * 60
        const decay = Math.pow(0.02, dt)
        d.vy *= decay
        d.vx *= decay
        if (d.auto && !rm) d.y += dt * 0.4
      }
    }
    d.x = THREE.MathUtils.clamp(d.x, -0.75, 0.95)
    if ((c.interact < 0.001 || c.interact > 0.999) && d.targetY === null && Math.abs(d.y) > Math.PI) {
      d.y = Math.atan2(Math.sin(d.y), Math.cos(d.y))
    }
    // Between interactive sections, ease back to the designed pose.
    if (c.interact < 0.05 && !d.dragging && d.targetY === null) {
      d.y = damp(d.y, Math.round(d.y / (Math.PI * 2)) * Math.PI * 2, 2.5, dt)
      d.x = damp(d.x, 0, 2.5, dt)
      d.vx = d.vy = 0
    }
    d.zoomCur = damp(d.zoomCur, d.zoom, 5, dt)

    // ---- compose transform
    const vw = state.viewport.width
    const fit = Math.min(1, vw / 3.7)
    const free = 1 - c.interact
    const sway = rm ? 0 : Math.sin(t * 0.32) * 0.38 * c.spin
    const mx = runtime.mouse.x
    const my = runtime.mouse.y
    root.current.position.set(c.x * Math.min(1, vw / 6), c.y, c.z)
    const zoom = 1 + (d.zoomCur - 1) * c.spots
    root.current.scale.setScalar(c.s * fit * zoom)
    const rx = c.rx + d.x * c.interact + my * 0.07 * free
    const ry = c.ry + d.y * c.interact + sway + mx * 0.12 * free
    root.current.rotation.set(rx, ry, c.rz + (rm ? 0 : Math.sin(t * 0.5) * 0.012))
    runtime.pose.rx = rx
    runtime.pose.ry = ry
    runtime.spots = c.spots
    if (!rm) float.current.position.y = Math.sin(t * 0.8) * 0.035
    root.current.visible = Math.abs(c.y) < 3.4

    // ---- exploded view
    const e = c.explode
    glassG.current.position.z = e * 1.3
    displayG.current.position.z = e * 0.85
    lensG.current.position.z = e * 0.42
    sealG.current.position.z = -e * 0.6
    bandG.current.position.z = -e * 0.95
    bandG.current.scale.setScalar(1 + e * 0.04)
    crownG.current.position.y = e * 0.32
    buttonG.current.position.y = e * 0.26
    sensorG.current.position.z = e * 1.75
    displayG.current.visible = e > 0.02
    lensG.current.visible = e > 0.02

    // ---- finish colours (lerped for real-time crossfade)
    const f = FINISHES[getState().finish]
    const k = 1 - Math.exp(-dt * 4)
    targetColors.frame.set(f.frame)
    targetColors.band.set(f.band)
    targetColors.seal.set(f.seal)
    targetColors.accent.set(f.accent)
    mats.frame.color.lerp(targetColors.frame, k)
    mats.frame.roughness = damp(mats.frame.roughness, f.frameRoughness, 4, dt)
    mats.band.color.lerp(targetColors.band, k)
    mats.seal.color.lerp(targetColors.seal, k)
    uniforms.uAccent.value.lerp(targetColors.accent, k)
    mats.chip.emissive.copy(uniforms.uAccent.value)

    // ---- light & display
    uniforms.uTime.value = rm ? 4 : t
    const pulse = rm ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6)
    uniforms.uDisplay.value = (0.13 + c.glow * 0.3) * (1 - e * 0.9)
    mats.halo.color.copy(uniforms.uAccent.value).multiplyScalar((1.1 + c.glow * 1.6) * pulse)
    mats.sensorDot.opacity = 0.15 + c.glow * 0.85 * pulse
    mats.sensorDot.color.copy(uniforms.uAccent.value)
    const floorMat = mats.floor as THREE.ShaderMaterial
    floorMat.uniforms.uColor.value.copy(uniforms.uAccent.value)
    floorMat.uniforms.uOpacity.value = (0.22 + c.glow * 0.25) * Math.max(0, 1 - Math.abs(c.y) / 2) * Math.max(0, 1 - Math.abs(c.x) * 0.9)
    glow.current.position.set(root.current.position.x, root.current.position.y - 0.95 * c.s * fit, root.current.position.z)
    glow.current.scale.setScalar(c.s * fit)
    if (!rm) crownSpin.current.rotation.y = t * 0.3

    // ---- project hotspot anchors to screen for the DOM layer
    const w = state.size.width
    const h = state.size.height
    camera.updateMatrixWorld()
    for (const id of Object.keys(HOTSPOT_NORMALS) as HotspotId[]) {
      const obj = anchors.current[id]
      if (!obj) continue
      obj.getWorldPosition(v)
      n.copy(HOTSPOT_NORMALS[id]).transformDirection(obj.matrixWorld)
      toCam.copy(camera.position).sub(v).normalize()
      const facing = n.dot(toCam)
      v.project(camera)
      runtime.hotspots[id] = { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: facing > 0.12 }
    }
  })

  const setAnchor = (id: HotspotId) => (o: THREE.Object3D | null) => {
    anchors.current[id] = o
  }

  return (
    <>
      <mesh ref={glow} geometry={geo.glowPlane} material={mats.floor} renderOrder={-1} />
      <group ref={root}>
        <group ref={float}>
          <mesh geometry={geo.shell} material={mats.frame} />
          <mesh geometry={geo.halo} material={mats.halo} />

          <group ref={glassG}>
            <mesh geometry={geo.glass} material={mats.glass} />
            <group ref={setAnchor('optics')} position={bendPoint(0.34, 0.08, glassSurfaceZ(0.34, 0.08))} />
          </group>

          <group ref={displayG}>
            <mesh geometry={geo.display} material={mats.display} />
            <mesh geometry={geo.chip} material={mats.chip} position={[0, 0.43, GLASS_Z - 0.06]} />
          </group>

          <group ref={lensG}>
            {[-0.33, 0.33].map((x) => {
              const p = bendPoint(x, 0.02, -0.02)
              return (
                <group key={x} position={p} rotation={[0, x / R, 0]}>
                  <mesh geometry={geo.lensRing} material={mats.dark} />
                  <mesh geometry={geo.lens} material={mats.lensGlass} />
                </group>
              )
            })}
          </group>

          <group ref={sealG}>
            <mesh geometry={geo.seal} material={mats.seal} />
            <group ref={setAnchor('seal')} position={[0, 0, -0.34]} />
          </group>

          <group ref={bandG}>
            <mesh geometry={geo.band} material={mats.band} />
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 1.2, 0, -0.68]} rotation={[0, s * 0.22, 0]}>
                <mesh geometry={geo.pod} material={mats.frame} />
                <mesh geometry={geo.podGrille} material={mats.dark} position={[s * 0.07, -0.02, 0.02]} />
              </group>
            ))}
            <group ref={setAnchor('band')} position={[-1.27, 0.05, -1.15]} />
          </group>

          <group ref={crownG}>
            <group position={crownPos} rotation={[0, -0.86 / R, 0]}>
              <mesh ref={crownSpin} geometry={geo.crown} material={mats.frame} />
              <mesh geometry={geo.crownCap} material={mats.halo} position={[0, 0.039, 0]} scale={[0.35, 1, 0.35]} />
              <group ref={setAnchor('crown')} position={[0, 0.05, 0]} />
            </group>
          </group>

          <group ref={buttonG}>
            <mesh geometry={geo.button} material={mats.frame} position={buttonPos} rotation={[0, 0.84 / R, 0]} />
          </group>

          <group ref={sensorG}>
            {sensors.map((s, i) => (
              <group key={i} position={s.p} rotation={[0, s.ry, 0]} scale={s.r * 0.8}>
                <mesh geometry={geo.sensorRing} material={mats.dark} />
                <mesh geometry={geo.sensorLens} material={mats.lensGlass} scale={[0.72, 0.72, 0.4]} />
                <mesh material={mats.sensorDot} position={[0, 0, 0.32]}>
                  <circleGeometry args={[0.22, 20]} />
                </mesh>
              </group>
            ))}
            <group ref={setAnchor('sensors')} position={sensors[1].p} />
          </group>
        </group>
      </group>
    </>
  )
}
