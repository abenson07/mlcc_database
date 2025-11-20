# Webflow Cloud Setup Guide

This document outlines the configuration and setup required for deploying this Next.js application to Webflow Cloud.

## Configuration Files

### wrangler.json
This file configures the Cloudflare Workers runtime for Webflow Cloud. The file includes:
- Node.js compatibility flags for edge runtime
- Compatibility date for Cloudflare Workers features

**Note:** Webflow Cloud will auto-generate additional configuration during deployment, but this base file ensures Node.js compatibility.

### next.config.js
Updated to include:
- `output: 'standalone'` for optimized builds
- External packages configuration for Supabase

## Required Environment Variables

Set these environment variables in your Webflow Cloud environment dashboard:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key for API operations
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (for webhook verification)

### Google Places API (if used)
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Google Places API key

## Deployment Steps

1. **Link your GitHub repository** to Webflow Cloud
2. **Set environment variables** in the Webflow Cloud dashboard for each environment (development, staging, production)
3. **Push to your main branch** - Webflow Cloud will automatically detect changes and deploy
4. **Monitor deployment logs** in the Webflow Cloud dashboard

## Storage Bindings (Optional)

If you need to use Webflow Cloud storage features (SQLite, Key Value Store, or Object Storage), add bindings to `wrangler.json`:

```json
{
  "r2_buckets": [
    {
      "binding": "CLOUD_FILES",
      "bucket_name": "cloud-files"
    }
  ]
}
```

After adding bindings, generate type definitions:
```bash
npx wrangler types
```

## Edge Runtime Compatibility

This application has been configured for Cloudflare Workers edge runtime:
- Stripe webhook handler updated for edge compatibility
- Node.js compatibility flags enabled in wrangler.json
- External packages properly configured in next.config.js

## Troubleshooting

- **Build failures**: Check that all environment variables are set in Webflow Cloud dashboard
- **Runtime errors**: Verify Node.js compatibility flags are enabled
- **API route issues**: Ensure server-side code uses edge-compatible APIs

## Resources

- [Webflow Cloud Documentation](https://developers.webflow.com/webflow-cloud/intro)
- [Getting Started Guide](https://developers.webflow.com/webflow-cloud/getting-started)
- [Environment Configuration](https://developers.webflow.com/webflow-cloud/environment/configuration)

