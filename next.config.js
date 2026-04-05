/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // External packages that should not be bundled by Next.js
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', 'midtrans-client', 'ioredis'],
  },
};

module.exports = nextConfig;