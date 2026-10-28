// On GitHub Pages the site is served from /<repo>, so the deploy workflow sets BASE_PATH.
const basePath = process.env.BASE_PATH || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
