# Nextbridge CMS (PayloadCMSTwo)

Next.js + Payload CMS project for managing multilingual pages with a **versioned dynamic block system** (schemas stored in PostgreSQL). Editors use Payload Admin; the public site lives under `src/app/(frontend)/`.

For deep dives (collection fields, hooks, historical diagrams), see **[architecture.md](./architecture.md)** — this README is the entry-point overview.

## Core ideas

- **Runtime versioned blocks:** `pages` store `dbLayout` instances that pin to `block-definition-versions`. New schema edits create new versions; existing pages keep stable content.
- **Payload-native content:** Each page can also use `hero` (see `src/heros/`) and `contentBlocks` (Payload blocks such as Testimonials) rendered alongside `dbLayout`.
- **Locales:** Enabled locale codes and default locale come from the **`locales`** collection. Middleware rewrites/redirects URLs; see **Locales & URLs** below.
- **Live preview:** Admin opens an iframe → `/api/draft` enables Next.js Draft Mode → the slug page skips the published-only filter → `LivePreviewListener` refreshes on save.
- **Block builder:** Visual schema editor at **`/block-builder`** (excluded from locale middleware).

## Tech stack

| Layer | Choice |
|--------|--------|
| App | Next.js 15 (App Router), React 19 |
| CMS | Payload 3.76.x (`@payloadcms/next`, Lexical, live preview) |
| Database | PostgreSQL (`@payloadcms/db-postgres`) |
| Styling | Tailwind CSS 4, Sass; theme tokens in `src/theme/` |
| Builder UX | Zustand, `@dnd-kit` |

## Repository map

| Path | Role |
|------|------|
| [payload.config.ts](./payload.config.ts) | Collections, globals, admin livePreview URL → `/api/draft`, Postgres |
| [src/middleware.ts](./src/middleware.ts) | Locale prefix redirect / unprefixed rewrite; excludes `api`, `admin`, `block-builder` |
| [src/app/(frontend)/](./src/app/(frontend)/) | Public site: `[locale]` layout + catch-all `[[...slug]]` + optional static routes |
| [src/app/(payload)/](./src/app/(payload)/) | Payload Admin + REST/GraphQL catch-all |
| [src/app/api/](./src/app/api/) | `draft`, `exit-draft`, `internal/locales`, blocks APIs, admin helpers |
| [src/collections/](./src/collections/) | Pages, media, locales, block definitions/versions, saved sections, header/footer locale docs |
| [src/globals/](./src/globals/) | **`theme`** global (shared); header/footer use **`header-locales`** / **`footer-locales`** collections per locale |
| [src/blocks/](./src/blocks/) | Registered React block components + schemas used by seed/builder |
| [src/renderer/](./src/renderer/) | `DynamicRenderer`, block registry, fallbacks |
| [src/block-builder/](./src/block-builder/), [src/builder/](./src/builder/) | Visual builder UI + server save/register |
| [src/scripts/seed.ts](./src/scripts/seed.ts) | `pnpm seed` |
| [src/migrations/](./src/migrations/) | Payload migrations |

## Locales & URLs

1. **`GET /api/internal/locales`** reads enabled locales from the DB (cached).
2. **Middleware** ([src/middleware.ts](./src/middleware.ts)): strips default locale prefix from the browser URL, passes non-default prefixes through, and **rewrites** unprefixed paths to `/${defaultLocale}${pathname}` so `[locale]` always resolves.

## Translating pages

1. **Configure locales** in Admin → **Site Settings → Locales**. Add every language you need (including the default, e.g. English) and mark exactly one as **Default Locale**.
2. **Create or open a page**, set its **Locale**, and **Save** (this generates a **Translation Group ID** shared by all variants).
3. In the page sidebar, use **Translate to…** (or **Create** next to a missing locale in **Translations**) to duplicate the page into another locale as a **draft** with the same page builder layout.
4. Edit translated content, then set **Status** to **Published**.
5. **Homepage** pages use slug `/` in each locale (e.g. `/` for default English, `/ur` for Urdu). **Header** and **footer** are configured separately under **Header Locales** and **Footer Locales**.

## Page render pipeline (CMS catch-all)

Trace from URL → HTML:

1. **`src/app/(frontend)/[locale]/[[...slug]]/page.tsx`** resolves `slug` (`/` when empty).
2. **`getPage(slug, localeCode, isDraft)`** uses `getPayload({ config })`, finds the **`locales`** document by `code`, then **`pages`** with `slug`, `locale`, and `status: 'published'` unless draft mode is on (`depth: 3` for relationships).
3. Root `/` with no CMS document falls back to **`HomePageContent`**.
4. The page renders:
   - **`LivePreviewListener`** only when draft mode is enabled.
   - **`RenderHero`** → **`DynamicRenderer`** (`page.dbLayout`) → **`RenderContentBlocks`** (`page.contentBlocks`).
5. **`DynamicRenderer`** ([src/renderer/DynamicRenderer.tsx](./src/renderer/DynamicRenderer.tsx)) maps each instance to `registry.get(blockSlug)` and passes `data` + `schema` from the pinned **`blockVersion`**.
6. **Registry** is populated once via **`src/blocks/registry-setup.ts`**, imported from **`src/app/(frontend)/layout.tsx`**.

## Frontend shell

- **`src/app/(frontend)/layout.tsx`** — loads global CSS and registry setup only.
- **`src/app/(frontend)/[locale]/layout.tsx`** — validates locale, loads **`header-locales`** / **`footer-locales`** for that locale (with fallbacks), resolves **`theme`** global, injects CSS variables and fonts, renders **`SiteHeader`** / **`SiteFooter`**.

## Environment & scripts

Copy **`.env.example`** and set:

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`

Common commands:

```bash
pnpm dev
pnpm build && pnpm start
pnpm seed
pnpm exec payload generate:types
pnpm exec payload generate:importmap
pnpm exec payload migrate
```

Requirements: Node `^18.20.2 || >=20.9.0`, **pnpm** 9 or 10.

## Suggested reading order

1. [architecture.md](./architecture.md) — collections, hooks, live preview narrative.
2. [payload.config.ts](./payload.config.ts).
3. [src/middleware.ts](./src/middleware.ts) and [src/app/api/internal/locales/route.ts](./src/app/api/internal/locales/route.ts).
4. [src/collections/Pages.ts](./src/collections/Pages.ts) and [src/renderer/](./src/renderer/).
5. [src/app/(frontend)/[locale]/[[...slug]]/page.tsx](./src/app/(frontend)/[locale]/[[...slug]]/page.tsx).
