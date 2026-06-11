# aarekaz.me

Compact public entrypoint for Anurag's internet system.

The page is a Bento-style personal dashboard that links out to the full archive
at `anuragd.me`: work, projects, writing, agent context, Apple Health, now, and
contact.

Dynamic card data is read from `public/dashboard.json` by default. For a live
feed, set `VITE_DASHBOARD_FEED_URL` to a public JSON endpoint with the same
shape as `src/data.ts`.

## Commands

```sh
npm install
npm run dev
npm run build
```

## Deploy

This is a static Vite app. It can deploy to Vercel or Cloudflare Pages with:

- build command: `npm run build`
- output directory: `dist`
