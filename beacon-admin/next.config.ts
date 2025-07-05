// next.config.js - Next.js configuration

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'img.youtube.com',
    ],
  },
  env: {
    CUSTOM_KEY: 'beacon-centre-admin',
  },
}

module.exports = nextConfig