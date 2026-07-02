/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/snake-game',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
