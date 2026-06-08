import type { NextConfig } from 'next'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Type checking done via tsc separately (Next.js 16 WASM worker crash on Windows)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'egptobpxcwttdiuvyxhw.supabase.co',
      },
    ],
  },
}

export default nextConfig
