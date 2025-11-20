/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Webflow Cloud / Cloudflare Workers configuration
  output: 'standalone',
  // Ensure compatibility with edge runtime
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

module.exports = nextConfig;

