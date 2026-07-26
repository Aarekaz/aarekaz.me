# aarekaz.me

Compact public entrypoint for Anurag's internet system.

The page is a minimal live index: identity, links, Apple Health-sized signals,
coding activity, presence, and experiments. It links out to the full archive at
`anuragd.me`.

Dynamic data is read from `public/live-feed.json` by default. For a live public
feed, set `VITE_LIVE_FEED_URL` to a JSON endpoint with the same shape as
`src/data/feed.ts`. Optional crowd presence can be enabled with
`VITE_CROWD_URL`.

## Commands

```sh
npm install
npm run dev
npm run build
```

## Data Bake

```sh
API_TOKEN=... npm run bake
```

The bake script reads `api.anuragd.me`, writes `public/live-feed.json`, and
keeps an existing feed if the token is missing during a build.

## Deploy

This is a static Vite app. It can deploy to Vercel or Cloudflare Pages with:

- build command: `npm run build`
- output directory: `dist`
