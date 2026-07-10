# American Pirate Federation Web Platform

Vite + React single-page app configured for Cloudflare Pages.

## Local setup

1. Install dependencies:
   `npm ci`
2. Copy and fill environment variables:
   `Copy-Item .env.example .env`
3. Run locally:
   `npm run dev`

## Required environment variables

- `VITE_THIRDWEB_CLIENT_ID`
- `VITE_ACTIVE_CHAIN` (`arbitrum` or `sepolia`)
- `VITE_APF_TREASURY_ADDRESS`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CF_ANALYTICS_TOKEN` (Cloudflare Web Analytics token)

## Cloudflare Pages setup

1. Authenticate Wrangler:
   `npx wrangler login`
2. This repo is configured to deploy to:
   `american-pirate-federation-web-platform-4062`
   (create it only if missing:
   `npx wrangler pages project create american-pirate-federation-web-platform-4062 --production-branch main`)
3. Add production vars in Cloudflare Pages (`Settings -> Environment variables`) using the required keys above.
4. Deploy:
   `npm run deploy:cloudflare`

## Useful scripts

- `npm run build` - production build
- `npm run cf:dev` - preview built app with Cloudflare Pages runtime
- `npm run deploy:cloudflare` - build and deploy to Cloudflare Pages

`public/_redirects` already contains SPA fallback routing for React Router.
