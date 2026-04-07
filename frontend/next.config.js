const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for production Docker minimal runner (Dockerfile.prod)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
