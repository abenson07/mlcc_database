/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Webflow Cloud / Cloudflare Workers configuration
  // Configure the base path and asset prefix to reflect the mount path of your environment
  // Mount path: /dashboard
  basePath: '/dashboard',
  assetPrefix: '/dashboard',
  // Ensure compatibility with edge runtime
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

module.exports = nextConfig;

