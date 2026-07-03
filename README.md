# devtegra.com

Source for [devtegra.com](https://devtegra.com), the website of Devtegra, LLC. Built with [Astro](https://astro.build) and Tailwind CSS, deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml` on every push to `main`.

## Editing

- Marketing pages: `src/pages/*.astro` (home, about, contact) and `src/pages/fitcreature/index.astro`.
- Legal pages: `src/pages/*.md` (privacy policy, terms of service, data deletion, consumer health data privacy, security). The URL slug is the filename; do not rename these files, the URLs are referenced externally.
- Root static files (`app-ads.txt`, `robots.txt`, `.well-known/security.txt`): `public/`.

## Local development

```sh
npm install
npm run dev      # dev server
npm run build    # static build to dist/
```
