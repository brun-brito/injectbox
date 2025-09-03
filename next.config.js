/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'storage.googleapis.com'],
    unoptimized: true
  }
}

module.exports = nextConfig
