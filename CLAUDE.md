# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is Camille Gr.'s personal blog/portfolio, built with Astro + the Starlight docs theme. It's entirely in French and focused on offensive security: CTF/HackTheBox/TryHackMe writeups, blog posts, small tools, and CTF reports. There is no application logic beyond Astro/Starlight configuration, two small presentational components, and Markdown/MDX content.

## Commands

Package manager is npm (`package-lock.json` is committed).

- `npm install` — install dependencies
- `npm run dev` / `npm start` — local dev server (`astro dev`)
- `npm run build` — production build to `./dist` (`astro build`)
- `npm run preview` — serve the built `./dist` locally
- `npm run astro -- <command>` — run arbitrary Astro CLI subcommands (e.g. `npm run astro -- check`)

There is no test suite and no lint script configured in this repo. Type checking relies on `tsconfig.json` (`astro/tsconfigs/strict`); use `npm run astro -- check` if type diagnostics are needed.

Deployment is automatic: `.github/workflows/deploy.yml` builds with `withastro/action` and publishes to GitHub Pages on every push to `main`. There is no separate staging step — pushing to `main` ships.

## Architecture

### Content is a single Starlight collection

All content lives under `src/content/docs/**` as Markdown/MDX files, registered as one `docs` collection in `src/content.config.ts` via Starlight's `docsLoader`/`docsSchema`. There are four top-level sections, each its own directory and each with its own index page:

- `writeups/` — HackTheBox and TryHackMe writeups (`writeups/hackthebox/*.mdx`, `writeups/tryhackme/*.md`)
- `blogs/` — blog articles
- `outils/` — small tools/utilities pages
- `ctf/` — CTF write-ups/reports (can contain nested subfolders per event, e.g. `ctf/RootMe Pro 2025 X DGSE/`)

The Starlight sidebar in `astro.config.mjs` mirrors these four sections, each using `autogenerate: { directory: '<name>' }` — new pages dropped into an existing directory show up automatically, but a brand-new top-level section needs a corresponding sidebar entry added there.

### Homepage and custom components

`src/content/docs/index.mdx` uses Starlight's `splash` template with a hero, then a hand-built grid of `CaseFolder` cards linking to the four sections, and a manually-maintained "Derniers Write-ups" list (this list is NOT auto-generated — add new entries by hand when publishing a writeup).

Two custom components live in `src/components/`:
- `CaseFolder.astro` — category card (tag/title/description/count) used on the homepage grid.
- `WriteupCard.astro` — writeup card used on section index pages (e.g. `writeups/index.mdx`); styled with a green accent for `platform="hackthebox"` and red for `platform="tryhackme"`. Its `image` prop accepts either an imported `ImageMetadata` (optimized) or a plain string path (rendered as a plain `<img>`).

### Image conventions (two different mechanisms)

- **Site-wide assets** (e.g. the hero portrait) live in `src/assets/` and are imported as ES modules — these go through Astro's image optimization pipeline.
- **Per-article images** live in `public/`, mirroring the content's URL path — e.g. `src/content/docs/writeups/hackthebox/tombwatcher.mdx` has its images in `public/writeups/hackthebox/tombwatcher/`. These are referenced with plain `<img src="...">` (relative or root-relative paths) and are NOT optimized by Astro. When adding a new writeup/post, create a matching folder under `public/` for its images following this same path structure.

### Styling and theming

All custom styling is a single global stylesheet, `src/styles/custom.css`, wired in via `customCss` in `astro.config.mjs`. It overrides Starlight's default CSS custom properties (`--sl-color-*`) to implement a "carnet d'enquête / dossier d'archives" (case-file) theme — warm charcoal/kraft-paper palette with a brass accent — plus a few custom design tokens (`--df-*`) used by `CaseFolder`/`WriteupCard`.

### Locale

The site is French-only: `defaultLocale: 'fr'` with a single root locale in `astro.config.mjs`. There is no i18n routing to account for.
