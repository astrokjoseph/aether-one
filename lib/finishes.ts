export type Finish = {
  id: string
  name: string
  material: string
  light: string
  description: string
  frame: string
  frameRoughness: number
  band: string
  seal: string
  accent: string
  swatch: [string, string]
}

export const FINISHES: Finish[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    material: 'Black titanium',
    light: 'Ember halo',
    description:
      'A deep, light-absorbing black titanium that disappears in a dark room, leaving only a warm ember line of light.',
    frame: '#2b2b30',
    frameRoughness: 0.34,
    band: '#1d1d21',
    seal: '#3b3b41',
    accent: '#ff6b3d',
    swatch: ['#4a4a52', '#121215'],
  },
  {
    id: 'lunar',
    name: 'Lunar',
    material: 'Bead-blasted silver',
    light: 'Glacier halo',
    description:
      'Bright, satin silver with a soft-touch knit in moonstone grey. Cool, quiet and luminous under any light.',
    frame: '#d8dade',
    frameRoughness: 0.26,
    band: '#c7cad0',
    seal: '#e9e9ec',
    accent: '#8fd6ff',
    swatch: ['#f4f5f7', '#9da1a8'],
  },
  {
    id: 'tide',
    name: 'Tide',
    material: 'Anodised deep blue',
    light: 'Aurora halo',
    description:
      'An ocean-floor blue anodised over titanium, paired with a mint aurora light that pulses with your attention.',
    frame: '#34495f',
    frameRoughness: 0.3,
    band: '#1f2b39',
    seal: '#3a4a5c',
    accent: '#5ef2cf',
    swatch: ['#5d7896', '#17222e'],
  },
  {
    id: 'dune',
    name: 'Dune',
    material: 'Champagne titanium',
    light: 'Solar halo',
    description:
      'Warm champagne titanium and a sand-toned knit, finished with a golden solar line. Made for the golden hour.',
    frame: '#c6a37a',
    frameRoughness: 0.28,
    band: '#806650',
    seal: '#cdb79c',
    accent: '#ffc163',
    swatch: ['#ead2ae', '#8a6a48'],
  },
]
