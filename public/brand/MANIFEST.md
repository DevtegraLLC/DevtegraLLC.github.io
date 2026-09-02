# FitCreature Brand Asset Library

The single home for FitCreature brand PARTS. Will drops source art into these folders (or hands files over to be filed); the compositional layer around the parts (layout, borders, text, fonts, messaging) lives in the templates that consume them. Served on **devtegra.com/brand/** and copied into the partner portal at build time (**partners.devtegra.com/assets/brand/**), so the website, the portal's print generator, and the marketing machine all pull from this one tree.

## Folders and naming

| Folder | Holds (parts, not composites) | Naming |
|---|---|---|
| `logos/` | Wordmark/logo files in every variant needed for composition | `fc_logo_color.png` · `fc_logo_black.png` · `fc_logo_white.png` (+ `.svg` beside any where it exists) |
| `icons/` | App icon exports | `fc_appicon_<size>.png` (1024 is the master; others derive from it) |
| `banners/` | Wide hero/banner art | `fc_banner_<slug>.png` |
| `flyers/` | Flyer/poster art pieces | `fc_flyer_art_<slug>.png` |
| `creatures/` | Creature stills/poses | `fc_creature_<name>_<pose>.png` |
| `elements/` | Decorative parts: borders, sparks, textures, frames | `fc_element_<slug>.png` |
| `qr/` | Print-ready QR files for every LIVE campaign code | `fitcreature_qr_<CODE>.svg/png` (the generator's names; never rename) |

Rules: lowercase snake_case, `fc_` prefix, one part per file, transparent backgrounds where the part is meant to sit on art. PNG for raster (full quality; the compositors resize), SVG beside it when vector exists.

## What consumes what

- **Partner print generator** (tent + lobby pages in `partners/src/pages/print/`): the partner picks **Color or Black & White**; Color composes `logos/fc_logo_white.png` (and `banners/` art as it lands) over the brand-dark design, B&W composes `logos/fc_logo_black.png` on white. Until a logo file exists the templates fall back to the styled-text wordmark (rule below). The QR always renders dark-on-light regardless of style.
- **devtegra.com**: pulls icons/logos from here (`/brand/...` paths) — the /fitcreature page, the home card, and /join use `icons/fc_appicon_512.png`.
- **Marketing machine**: pulls any part by URL (`https://devtegra.com/brand/<folder>/<file>`) or from this repo, and composes posts/ads with the tokens below.

## Compositional tokens (the layer Devtegra provides)

| Token | Value |
|---|---|
| Indigo (brand seed) | `#6366F1` |
| Wordmark gold | `#F0C040` |
| Deep violet (dark top) | `#1B1530` |
| Near-black violet (dark base) | `#0A0815` |
| Lavender accent | `#C0C1FF` |
| Wordmark rule | "Fit" white + "Creature" gold, weight 800, until/unless a logo FILE in `logos/` supersedes it |
| Type | System/ui-sans for print pieces; mono for codes |

Sources of truth for the token values live in the app code (`kBrandSeed`, the share-composite painter); update here when the app rebrands.

## Keeping app-derived parts current

- **App icon**: whenever the app icon changes, run `scripts/sync_brand_assets.sh` in the FitCreature repo — it copies the current iOS 1024 master here and regenerates the 512. Commit this repo after.
- **QR files**: when a new campaign code goes live, generate its files into `qr/` (`deno run --allow-write --allow-read --allow-env scripts/campaign_qr.ts <CODE> --out <this repo>/public/brand/qr` from the FitCreature repo; procedure in its F89 runbook).
- **Partner logos are NOT here**: they belong to partners (served from the app's storage bucket, used under each partner's brand license).
