# AETHER ONE — launch site

Next.js 15 · React 19 · Tailwind CSS 4 · React Three Fiber · Framer Motion · Lenis.
All device geometry, materials, textures and fonts are generated or bundled locally.

```bash
npm install
npm run dev     # http://localhost:3107
npm run build && npm start
```

- `components/three/` — procedural device geometry, shaders and the shared WebGL scene
- `lib/poses.ts` — scroll choreography keyframes for the device, per section
- `components/sections/` — page sections; `components/interface/` — the three interactive demos
