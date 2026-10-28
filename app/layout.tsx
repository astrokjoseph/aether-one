import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/inter-tight'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'AETHER ONE — Reality, re-rendered',
  description:
    'AETHER ONE is a spatial computer that places light, sound and intelligence into the space around you. Reservations open now.',
}

export const viewport: Viewport = {
  themeColor: '#050507',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
