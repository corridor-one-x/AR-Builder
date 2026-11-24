# AR Builder

Website for AR Builder, architects and builders in Chennai (est. 2010).

## Pages
- **Home** (`/home`, also `/`): scroll-driven hero film, services, projects, process, testimonials
- **About** (`/about`)
- **Contact** (`/contact`): enquiry form delivered by email via [Web3Forms](https://web3forms.com)
- **Privacy** (`/privacy`) and **Terms** (`/terms`)

Clean page URLs are rewritten to `index.html` by `_redirects` (Cloudflare Pages, Netlify), `vercel.json` (Vercel) and `serve.py` (local).

## Run locally
```bash
python3 serve.py
```
Then open http://localhost:4173/

`serve.py` is a small static server with HTTP Range support, which browsers need to stream and loop video smoothly (Safari in particular). Any static host works in production.

## Structure
- `index.html`: the site (pages, content, styles and behaviour)
- `support.js`: page runtime (renders `index.html`; loads React from a CDN)
- `FlexCarousel.jsx`: home photo carousel
- `ar-effects.js`: particle background and custom cursor
- `waves-bg.js`: animated WebGL background on the Contact page
- `assets/`: images, videos, poster frames, and the hero film frames (`hero-frames/desktop`, `hero-frames/mobile`)

## Deploy
Static site with no build step. Hosted on Cloudflare Pages, connected to this GitHub repository:
every push to `main` goes live automatically.

Cloudflare Pages build settings: framework preset **None**, build command **empty**, build output directory **/** (repository root).
