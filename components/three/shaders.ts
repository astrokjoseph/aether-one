import * as THREE from 'three'

/** Adds light without touching canvas alpha, so glows composite over the page. */
const ADDITIVE = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const

export const AURORA_GLSL = /* glsl */ `
float ae_hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ae_noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = ae_hash(i), b = ae_hash(i + vec2(1.0, 0.0));
  float c = ae_hash(i + vec2(0.0, 1.0)), d = ae_hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float ae_fbm(vec2 p){ float v = 0.0; float a = 0.5; for(int i = 0; i < 5; i++){ v += a * ae_noise(p); p *= 2.03; a *= 0.5; } return v; }
vec3 ae_aurora(vec2 uv, float t, vec3 accent){
  vec2 p = (uv - 0.5) * vec2(3.2, 1.5);
  float n = ae_fbm(p * 1.4 + vec2(t * 0.12, -t * 0.07));
  float n2 = ae_fbm(p * 2.6 - vec2(t * 0.09, t * 0.05) + n);
  float ribbon = smoothstep(0.0, 0.9, sin(p.x * 2.2 + n2 * 4.0 + t * 0.45) * 0.5 + 0.5);
  ribbon *= smoothstep(0.9, 0.0, abs(p.y + (n - 0.5) * 0.9));
  vec3 cool = vec3(0.28, 0.36, 1.0);
  vec3 col = mix(cool, accent, smoothstep(0.25, 0.75, n2));
  col = mix(col, vec3(1.0), pow(ribbon, 6.0) * 0.35);
  return col * (ribbon * 1.15 + n * 0.12);
}
`

export type DisplayUniforms = {
  uTime: { value: number }
  uAccent: { value: THREE.Color }
  uDisplay: { value: number }
}

/** Patches a physical material so the glass carries a living aurora underneath its clearcoat. */
export function patchGlass(mat: THREE.MeshPhysicalMaterial, uniforms: DisplayUniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 planar;\nattribute float front;\nvarying vec2 vPlanar;\nvarying float vFront;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPlanar = planar;\nvFront = front;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uTime;\nuniform vec3 uAccent;\nuniform float uDisplay;\nvarying vec2 vPlanar;\nvarying float vFront;\n${AURORA_GLSL}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float edge = smoothstep(0.0, 0.18, vPlanar.x) * smoothstep(1.0, 0.82, vPlanar.x) * smoothstep(0.0, 0.25, vPlanar.y) * smoothstep(1.0, 0.75, vPlanar.y);
        totalEmissiveRadiance += ae_aurora(vPlanar, uTime, uAccent) * uDisplay * vFront * edge;`,
      )
  }
  mat.customProgramCacheKey = () => 'aether-glass'
}

export function makeDisplayMaterial(uniforms: DisplayUniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    toneMapped: false,
    vertexShader: /* glsl */ `
      attribute vec2 planar;
      varying vec2 vPlanar;
      void main(){ vPlanar = planar; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uAccent; uniform float uDisplay;
      varying vec2 vPlanar;
      ${AURORA_GLSL}
      void main(){
        vec3 col = ae_aurora(vPlanar, uTime, uAccent) * 1.6 + vec3(0.02, 0.025, 0.05);
        vec2 px = fract(vPlanar * vec2(220.0, 100.0));
        float grid = smoothstep(0.0, 0.18, px.x) * smoothstep(0.0, 0.18, px.y);
        col *= 0.55 + 0.45 * grid;
        float scan = 0.5 + 0.5 * sin(vPlanar.y * 60.0 - uTime * 3.0);
        col += uAccent * 0.05 * scan;
        gl_FragColor = vec4(col * uDisplay, 1.0);
      }
    `,
  })
}

export function makeGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    ...ADDITIVE,
    toneMapped: false,
    uniforms: { uColor: { value: new THREE.Color('#ff6b3d') }, uOpacity: { value: 0.6 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.6); gl_FragColor = vec4(uColor * a * uOpacity, 1.0); }
    `,
  })
}

export function makeDustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    ...ADDITIVE,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uColor: { value: new THREE.Color('#ff6b3d') },
      uOpacity: { value: 1 },
      uPixelRatio: { value: 1 },
      uSize: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uScroll; uniform float uPixelRatio; uniform float uSize;
      attribute float aSeed;
      varying float vTw; varying float vSeed;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uScroll + uTime * 0.03 * (0.4 + aSeed), 12.0) - 6.0;
        p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.12;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.6 + aSeed * 1.6) * uPixelRatio * (14.0 / -mv.z);
        vTw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
        vSeed = aSeed;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vTw; varying float vSeed;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 c = mix(vec3(0.85, 0.9, 1.0), uColor, step(0.72, vSeed));
        gl_FragColor = vec4(c * a * vTw * uOpacity * 0.5, 1.0);
      }
    `,
  })
}
