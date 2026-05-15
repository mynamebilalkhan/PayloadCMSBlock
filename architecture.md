# Architecture: PayloadCMS App

## Overview

A Payload CMS 3.76 + Next.js 15 App Router project for managing site pages with a dynamic block architecture. The codebase has two page-authoring paths:

- A **runtime versioned block system** where block schemas live in the database. Pages store block instances that pin to immutable schema versions, so schema changes do not break existing content.
- A **Payload-native page authoring path** in `Pages.ts` that adds a `hero` group and a Payload `blocks` field for configured blocks such as `Testimonials`.

Both paths are rendered by the frontend route. The runtime block system has been extended with four features: conditional field logic, advanced validation rules, visual UI metadata (tabbed/grid admin layout), and nested/composable blocks. The admin panel supports **Live Preview** — an embedded iframe that re-renders the frontend on every document save so editors can preview draft content in real time.

The site is **multilingual**: enabled languages live in the **`locales`** collection; middleware and `[locale]` routing resolve URL prefixes; each **page** belongs to one locale and links to sibling translations via **`translationGroupId`**. Editors duplicate pages into other locales with **Translate to…** in the admin sidebar. The frontend shell (header, footer) is configured per locale via **`header-locales`** / **`footer-locales`** collections; the **theme** global is shared across all locales.

A **visual block builder** is embedded at `/block-builder` (same port, no separate process). It provides a drag-and-drop GUI for designing block schemas and publishing them directly to the database. Existing blocks can be loaded back into the builder from the Payload admin via the "Edit in Block Builder" button, enabling a full re-versioning round-trip.

**Stack:**
- Backend: Payload CMS 3.76.0 with PostgreSQL adapter
- Frontend: Next.js 15 (App Router)
- Database: PostgreSQL (via `postgresAdapter`)
- Package manager: pnpm 10.x (ESM module, Node 18.20.2+ or 20.9+)
- Runtime: React 19.2.1, TypeScript 5.7.3, Tailwind CSS 4.x
- Rich text: Payload Lexical editor
- Media processing: Sharp

---

## Collections

### 1. `block-definitions` — Master Registry
**File:** `src/collections/BlockDefinitions.ts`

One document per unique block type (e.g., "Hero Banner").

| Field | Type | Notes |
|-------|------|-------|
| `name` | text | Human-readable name |
| `slug` | text (unique) | Kebab-case machine ID, e.g. `hero-banner` — auto-normalized |
| `description` | textarea | Shown to content editors |
| `category` | select | `layout`, `content`, `media`, `navigation`, etc. |
| `icon` | text | Optional icon name or emoji |
| `currentVersion` | relationship → block-definition-versions | Auto-updated pointer to latest version |
| `isDeprecated` | checkbox | Prevents new pages from using block |
| `previewComponent` | text | Optional path to React preview component |
| `thumbnail` | upload → media | Preview image for block picker UI |
| `previewImage` | upload → media | Full-size preview on hover |
| `editInBuilderButton` | ui | Custom component: renders "Edit in Block Builder" link in admin detail view |

**Hooks:** `beforeChange` normalizes slug to kebab-case.

---

### 2. `block-definition-versions` — Immutable Schema Snapshots
**File:** `src/collections/BlockDefinitionVersions.ts`

Write-once schema snapshots. Each schema change creates a new version document; existing versions are never mutated (`update` access: `false`).

| Field | Type | Notes |
|-------|------|-------|
| `blockDefinition` | relationship → block-definitions | Parent block type |
| `versionNumber` | number | Auto-assigned sequential (1, 2, 3…) |
| `versionLabel` | text (read-only) | Display label, e.g. `v3` |
| `schema` | json | `BlockSchema` field definitions |
| `changelog` | textarea | Optional notes on what changed |
| `isStable` | checkbox | Unstable versions hidden from page builder |
| `blockSlug` | text (read-only) | Denormalized from parent for fast renderer lookups |

**Hooks:**
- `beforeValidate`: auto-assigns version number, validates schema via `validateBlockSchema()`, denormalizes parent slug, auto-wraps bare array schemas as `{ fields: [...] }`
- `afterChange`: updates parent `BlockDefinition.currentVersion` pointer on creation (passes `req` to share DB transaction)

---

### 3. `pages` — Page Content
**File:** `src/collections/Pages.ts`

Page metadata plus authoring fields for both the runtime block system and the newer Payload-native content model.

**Meta fields:** `title`, `slug` (auto-normalized, unique per locale), `status` (`draft` / `published` / `archived`)

**Locale & translation (sidebar):**

| Field | Type | Notes |
|-------|------|-------|
| `locale` | relationship → `locales` | **Required.** Language this page is written in |
| `translationGroupId` | text (read-only) | UUID shared by all variants; auto-generated on create if missing |
| `translationStatus` | ui | Custom component: lists enabled locales and translation coverage |
| `duplicateForLocale` | ui | Custom component: **Translate to…** modal to create a draft copy in another locale |

**SEO group:** `seo.metaTitle`, `seo.metaDescription`, `seo.ogImage` (upload), `seo.noIndex`

**Top-level runtime `dbLayout` array (rendered by `DynamicRenderer`):**

| Field | Type | Notes |
|-------|------|-------|
| `blockDefinition` | relationship → block-definitions | Which block type |
| `blockVersion` | relationship → block-definition-versions | Pinned version (locked after first save) |
| `instanceId` | text (read-only) | Stable unique ID |
| `label` | text | Optional editor label |
| `data` | json | Field values conforming to pinned schema |
| `hidden` | checkbox | Hide on frontend without deleting |
| `anchor` | text | HTML anchor ID for deep-linking |

**Key design:** Pages pin to a specific `blockVersion` per instance. Schema updates create new versions and do not mutate already-authored page instances.

**Payload-native fields also present on each page:**

| Field | Type | Notes |
|-------|------|-------|
| `hero` | group | Shared hero field from `src/heros/config.ts`; rendered via `<RenderHero />` |
| `contentBlocks` | blocks array | Payload blocks field allowing `Testimonials`; rendered via `<RenderContentBlocks />` |

**Access and hooks:**
- Public reads are limited to `status: 'published'`; authenticated users can read drafts.
- `beforeChange` normalizes slugs to lowercase path-safe strings, coerces `locale` to a numeric relationship ID when present (PostgreSQL), and auto-assigns `translationGroupId` on create.
- Slug `validate` checks uniqueness per `(slug, locale)` using `coerceRelationshipId` for query consistency.

**Database:** Migration `20250514000000_locale_system` adds a compound unique index `pages_slug_locale_unique` on `(slug, locale_id)`.

---

## Locales & Multilingual Pages

### `locales` — Site languages
**File:** `src/collections/Locales.ts`

Admin group: **Site Settings**. Defines every language the site can serve.

| Field | Type | Notes |
|-------|------|-------|
| `name` | text | Display name, e.g. "English", "Urdu" |
| `code` | text (unique) | BCP-47-style code used in URLs, e.g. `en`, `ur` — normalized to lowercase |
| `isDefault` | checkbox | Exactly one locale should be default; hook unsets others when a new default is saved |
| `isEnabled` | checkbox | Disabled locales return 404 on the frontend |
| `isRTL` | checkbox | Sets `dir="rtl"` on `<html>` for this locale |
| `sortOrder` | number | Order in admin lists and locale pickers |
| `flag` | text | Optional emoji shown in admin UI |

**Hooks:** `afterChange` calls `revalidateTag('locales')` so middleware and `getLocales()` pick up changes.

The **default locale must exist as a row** in this collection (e.g. English with `isDefault: true`). It is not a separate config flag outside the table.

---

### `header-locales` / `footer-locales` — Per-locale shell
**Files:** `src/collections/HeaderLocales.ts`, `src/collections/FooterLocales.ts`

One document per locale (unique `locale` relationship). The `[locale]/layout.tsx` fetches these by locale ID, with fallback to the default locale's header/footer if a locale-specific record is missing.

---

### Relationship ID coercion (PostgreSQL)
**File:** `src/lib/payload/coerceRelationshipId.ts`

Payload's Postgres adapter uses **numeric** document IDs. JSON request bodies and HTML form fields often send IDs as **strings**. SQL `equals` filters frequently still match, but **relationship validation on `create`/`update` rejects string IDs**.

```ts
coerceRelationshipId(value)   // "2" → 2, leaves non-numeric strings as-is
relationshipIdsEqual(a, b)    // compare across string/number mismatch
```

Used in `Pages` hooks/validators, `duplicatePageForLocale`, and the duplicate admin UI when posting `targetLocaleId`.

---

### Page translation workflow

**Goal:** One logical page (e.g. Home) exists as **separate CMS documents per locale**, linked by `translationGroupId`, each with its own slug (typically the same path, e.g. `/` for home in every locale).

```mermaid
sequenceDiagram
  participant Editor
  participant UI as DuplicateForLocale
  participant API as duplicate-page-locale
  participant Lib as duplicatePageForLocale
  participant Payload

  Editor->>UI: Translate to… select Urdu
  UI->>API: POST pageId targetLocaleId
  API->>Lib: authenticated user
  Lib->>Payload: create draft page locale=targetLocale.id
  Payload-->>Editor: redirect to new page
```

**Admin steps:**
1. Configure locales in **Site Settings → Locales** (include default language).
2. Create/edit a page, set **Locale**, **Save** (generates `translationGroupId`).
3. Sidebar **Translations** shows coverage; **Translate to…** or **Create** opens the duplicate modal.
4. Edit the new **draft**, then **Publish**.

**Core logic:** `src/lib/admin/duplicatePageForLocale.ts`

| Step | Rule |
|------|------|
| Source | Load page at `depth: 0`; require `translationGroupId` |
| Same locale | 400 — cannot translate into the current locale |
| Target locale | Must exist and be `isEnabled` |
| Duplicate in group | 409 with `existingId` if group + locale already has a page |
| Slug | Copy source slug; on conflict append `-{code}` except homepage |
| Homepage `/` | Never produce `/-ur`; 409 if `/` already exists for target locale |
| Create | `status: 'draft'`, `locale: targetLocale.id` (numeric), copy `title`, `seo`, `dbLayout`, `contentBlocks` |

**API:** `POST /api/admin/duplicate-page-locale` — see [API Routes](#post-apiadminduplicate-page-locale).

---

### Locale routing (middleware + frontend)

**Middleware:** `src/middleware.ts`

- Loads enabled codes + default from `GET /api/internal/locales` (Edge-safe; 60s cache).
- **Default locale:** strips prefix from URL (`/en/about` → `/about`).
- **Other locales:** passes through (`/ur/about`).
- **Unprefixed paths:** rewrites to `/{defaultLocale}{pathname}` internally so `[locale]` always resolves.

**Internal locales API:** `src/app/api/internal/locales/route.ts` — returns `{ codes, defaultCode }` for middleware.

**Locale utilities:** `src/lib/locale/index.ts` — `getLocales()`, `getDefaultLocale()`, `validateLocale()`, cached with tag `locales`.

**Frontend layout:** `src/app/(frontend)/[locale]/layout.tsx`

- Validates locale code; `notFound()` if disabled/unknown.
- Wraps children in `LocaleProvider` (RTL, code).
- Loads `header-locales`, `footer-locales`, and global `theme`.
- Renders `SiteHeader` / `SiteFooter`.

**Catch-all page:** `src/app/(frontend)/[locale]/[[...slug]]/page.tsx`

- Resolves `slug` (`/` when empty).
- `getPage(slug, localeCode, isDraft)` finds locale by `code`, then page by `slug` + `locale` + `status`.
- Root `/` with no CMS document falls back to static `HomePageContent`.
- `generateMetadata` builds **hreflang** alternates from sibling pages sharing `translationGroupId`.

**URL examples** (default `en`):

| Locale | Home | About page |
|--------|------|------------|
| English (default) | `/` | `/about-us` |
| Urdu | `/ur` | `/ur/about-us` |

**Live preview:** `payload.config.ts` `livePreview.url` includes `locale` query param: `/api/draft?slug=...&locale=...`.

---

### Payload-Native Hero Field
**File:** `src/heros/config.ts`

The `hero` group supports four render types:

| Type | Renderer |
|------|----------|
| `none` | No hero |
| `highImpact` | `src/heros/HighImpact/index.tsx` |
| `mediumImpact` | `src/heros/MediumImpact/index.tsx` |
| `lowImpact` | `src/heros/LowImpact/index.tsx` |

Hero content includes Lexical rich text, up to two CTA links via `linkGroup()`, and a required media upload for high/medium impact variants. `src/heros/RenderHero.tsx` selects the renderer by `hero.type` and is rendered at the top of every page via `<RenderHero hero={page.hero} />`.

---

### Payload-Native Testimonials Block
**File:** `src/blocks/Generic/Testimonials/config.ts`

`Testimonials` is a standard Payload `Block` with an `items` array. Each item stores `name`, `company`, and `testimonial`. It is registered in the `contentBlocks` Payload blocks field in `Pages.ts` and rendered on the frontend by `RenderContentBlocks`.

### RenderContentBlocks
**File:** `src/blocks/RenderContentBlocks.tsx`

`RenderContentBlocks({ blocks })` renders the Payload-native `contentBlocks` array. It switches on `block.blockType` and delegates to the appropriate view component. Currently handles `'testimonials'` blocks; unknown block types render nothing (no crash). Rendered at the bottom of every page below `DynamicRenderer`.

---

### 4. `media` — Image & File Uploads
**File:** `src/collections/Media.ts`

Public image uploads with required `alt` text and optional `caption`. Image resizing is handled via Sharp. Image sizes: `thumbnail` (400×300), `card` (768×1024), `tablet` (1024×auto). Uploads are limited to `image/*` and use `thumbnail` as the admin thumbnail.

---

### 5. `users` — Authentication
Inline in `payload.config.ts`. Email + name fields; used to authenticate API calls.

---

## Globals

Payload Globals are singleton documents — one record per global. The **theme** global applies site-wide. **Header** and **footer** content for the public site is primarily managed through **`header-locales`** and **`footer-locales`** collections (one record per locale); legacy **`header`** / **`footer`** globals remain registered and may be used as fallbacks in layout code.

### Header Global
**File:** `src/globals/Header.ts`

Controls the site-wide navigation bar.

| Field | Type | Notes |
|-------|------|-------|
| `logo` | upload → media | Optional logo image |
| `navigationItems` | array | Top-level nav items (see below) |
| `ctaButton` | group | `text` + `url` for the primary CTA in the nav |
| `stickyHeader` | checkbox (default: true) | Keeps header fixed on scroll |

**Navigation item fields:**

| Field | Type | Notes |
|-------|------|-------|
| `label` | text (required) | Link label |
| `url` | text | Relative or absolute URL — optional when children are present |
| `openInNewTab` | checkbox | |
| `children` | array | Dropdown items: `label` (required), `url` (required), `openInNewTab` |

Nav items with a non-empty `children` array render as dropdown menus on desktop and accordions on mobile. Parent items with children but no `url` act as pure dropdown triggers with no navigation of their own.

---

### Footer Global
**File:** `src/globals/Footer.ts`

Controls the site-wide footer.

| Field | Type | Notes |
|-------|------|-------|
| `logo` | upload → media | Optional footer logo |
| `columns` | array | Link columns: `heading` + `links[]` (label + url + openInNewTab) |
| `socialLinks` | array | Platform select (`twitter`, `linkedin`, `github`, `youtube`, `instagram`, `facebook`) + `url` |
| `copyright` | text | Copyright line |

---

### Globals barrel export
**File:** `src/globals/index.ts`

```ts
export { Header } from './Header'
export { Footer } from './Footer'
```

Both are registered in `payload.config.ts` under `globals: [Header, Footer]`.

---

## Frontend Layout

### Root Layout
**File:** `src/app/(frontend)/layout.tsx`

Minimal wrapper: imports global CSS and `@/blocks/registry-setup` so block components are registered before any page renders. Does **not** render `<html>` / `<body>` — that happens in the locale layout.

### Locale Layout
**File:** `src/app/(frontend)/[locale]/layout.tsx`

An `async` server component that:
1. Validates `locale` via `validateLocale(localeCode)` — `notFound()` if disabled or unknown
2. Fetches **`header-locales`** and **`footer-locales`** for the locale ID (with fallback to default locale's records)
3. Fetches global **`theme`** and injects CSS variables / Google Fonts
4. Wraps content in `LocaleProvider` (exposes locale record to client components; sets `dir` for RTL)
5. Renders `<SiteHeader>` → `<main>{children}</main>` → `<SiteFooter>`

---

### SiteHeader Component
**File:** `src/components/layout/Header.tsx`

`'use client'` — needs `useState` for mobile menu and dropdown state.

**Props (`SiteHeaderProps`):** `logo`, `navigationItems`, `ctaButton`, `stickyHeader`

**Desktop nav:** Items with `children` render a button that toggles a `role="menu"` dropdown panel. An invisible `fixed inset-0` backdrop div closes any open dropdown on outside click without a `useEffect` listener. Items without children render as plain `<a>` links; items with a URL only and no children render as standard links; items with no URL and no children render as a `<span>`.

**Mobile nav:** A hamburger button (hidden on `lg+`) toggles a full-width drawer below the header bar. Items with children render as accordions with a `border-l-2` indented sub-list. Navigating to any link closes the drawer automatically.

**State:**
- `mobileOpen: boolean` — drawer visibility
- `openDropdown: number | null` — index of the currently open desktop dropdown
- `openMobileSection: number | null` — index of the currently expanded mobile accordion

**ChevronDown** icon accepts a `className` prop for the `rotate-180` open/close animation.

---

### SiteFooter Component
**File:** `src/components/layout/Footer.tsx`

Server component (no interactivity needed).

Renders a four-area footer: brand column (logo + tagline), dynamic link columns from the `columns` global field, a social links row, and a copyright bar. The `SocialIcon` sub-component switches on `platform` to render the correct SVG for six platforms: Twitter/X, LinkedIn, GitHub, YouTube, Instagram, Facebook.

---

## Block Components

All runtime block components follow the same pattern:

```ts
export function MyBlock({ data, anchor }: BlockComponentProps<MyData>) { ... }
export const mySchema = { fields: [...] }
```

The schema export is used by `seed.ts` to register the block definition in the database. The component export is registered in the `BlockRegistry` via `registry-setup.ts`.

### HeroBanner
**File:** `src/blocks/HeroBanner/index.tsx`

Full-width two-column hero section.

| Field | Notes |
|-------|-------|
| `badge` | Announcement pill above the heading |
| `heading` | Main heading text (required) |
| `headingHighlight` | Word or phrase rendered in indigo with a highlight underbar |
| `description` | Subheading paragraph |
| `primaryCtaLabel` / `primaryCtaUrl` | Filled indigo CTA button |
| `secondaryCtaLabel` / `secondaryCtaUrl` | Ghost outline button with play icon |
| `mockupImage` | Optional screenshot — falls back to CSS `DashboardMockup` component |
| `socialProofText` | Text beside avatar stack and star rating |

Visual details: ambient blobs (`blur-3xl`), floating notification cards (deployment success + collaborator joined), glow behind the mockup card. `DashboardMockup` is a pure decorative component built entirely with Tailwind height/color classes — no inline styles.

---

### RichText
**File:** `src/blocks/RichText/index.tsx`

| Field | Notes |
|-------|-------|
| `content` | HTML string rendered via `dangerouslySetInnerHTML` |
| `alignment` | `left` / `center` / `right` — controls text alignment and container margin |

Applies Tailwind `prose` with custom overrides: indigo-tinted links, blockquote background fill, code pill styling, colored list markers. `max-w-3xl` inner container constrains line length; `center` alignment applies `mx-auto` to center the block.

---

### CardGrid
**File:** `src/blocks/CardGrid/index.tsx`

| Field | Notes |
|-------|-------|
| `heading` | Section heading |
| `subheading` | Optional paragraph below the heading |
| `columns` | Select: `'2'` / `'3'` / `'4'` (string values matching the seed schema) |
| `cards[]` | `title` (required), `description`, `image`, `linkUrl`, `linkLabel` |

Cards display a colored accent bar at the top (cycling through 6 colors: indigo, violet, sky, emerald, amber, rose). When no image is provided, a matching colored icon circle appears. Cards hover-lift (`-translate-y-1`) and deepen shadow. A link arrow appears at the bottom when `linkUrl` + `linkLabel` are set.

---

### Features
**File:** `src/blocks/Features/index.tsx`

Icon-based feature grid with 5 layout variants.

| Field | Notes |
|-------|-------|
| `variant` | `default` / `minimal` / `dark` / `gradient` / `cards` |
| `sectionLabel` | Small tag rendered above the heading |
| `heading` | Section heading |
| `subheading` | Optional subtitle paragraph |
| `columns` | `'2'` / `'3'` / `'4'` — responsive grid columns |
| `features[]` | `title`, `description`, `icon` (16 named SVG icons) |

Icon map `iconPaths` covers 16 inline SVG options: `zap`, `shield`, `layers`, `globe`, `code`, `chart`, `settings`, `star`, `heart`, `check`, `rocket`, `puzzle`, `users`, `mail`, `lock`, `cpu`. Unknown names fall back to `zap`.

---

### CTA
**File:** `src/blocks/CTA/index.tsx`

Call-to-action section with 6 style variants and two layout modes.

| Field | Notes |
|-------|-------|
| `variant` | `default` / `minimal` / `dark` / `gradient` / `brand` / `glass` |
| `layout` | `centered` / `split` |
| `eyebrow` | Small label above heading |
| `heading` | Main heading text |
| `description` | Supporting paragraph |
| `primaryCtaLabel` / `primaryCtaUrl` | Primary action button |
| `secondaryCtaLabel` / `secondaryCtaUrl` | Secondary ghost/outline button |

The `glass` variant uses `backdrop-blur-xl bg-white/5 border-white/10`. Gradient and brand variants add decorative ambient glow blobs (`blur-3xl opacity-20`).

---

### Testimonials
**File:** `src/blocks/Testimonials/index.tsx`

Customer testimonial grid. Server component — no client state needed.

| Field | Notes |
|-------|-------|
| `variant` | `default` / `featured` / `dark` |
| `sectionLabel` | Tag above heading |
| `heading` | Section heading |
| `subheading` | Optional subtitle |
| `testimonials[]` | `quote`, `name`, `title`, `company`, `rating` (select `'3'`/`'4'`/`'5'`) |

`featured` variant: first testimonial rendered large in the left column; items 1–2 stacked in the right column. Star rating clamped to 1–5 range. Avatar initials fallback: first letter of each name word.

---

### FAQ
**File:** `src/blocks/FAQ/index.tsx`

Accordion FAQ block. `'use client'` — uses `useState` for open/close accordion state.

| Field | Notes |
|-------|-------|
| `variant` | `default` / `minimal` / `dark` |
| `layout` | `single-column` / `two-column` |
| `sectionLabel` | Small tag above heading |
| `heading` | Section heading |
| `subheading` | Optional subtitle |
| `items[]` | `question`, `answer` |

`flush` variant: `border-0 border-b rounded-none` — divider lines only. Two-column layout uses `grid sm:grid-cols-2`. `ChevronIcon` animates `rotate-180` when open. Only one item open at a time; clicking an open item closes it.

---

### Pricing
**File:** `src/blocks/Pricing/index.tsx`

Pricing plan cards with highlighted plan support and 4 style variants.

| Field | Notes |
|-------|-------|
| `variant` | `default` / `gradient` / `dark` / `minimal` |
| `sectionLabel` | Tag above heading |
| `heading` | Section heading |
| `subheading` | Optional subtitle |
| `plans[]` | `name`, `description`, `price`, `period`, `badge`, `highlighted` (boolean), `features[]` (`{ text }[]`), `ctaLabel`, `ctaUrl` |

The variant map has parallel keys for highlighted vs non-highlighted plans: `card`/`cardHL`, `cta`/`ctaHL`, etc. Grid columns auto-determined by `plans.length`. `CheckIcon` uses `stroke` (not `fill`) for a clean checkmark.

---

### Block Registration
**File:** `src/blocks/registry-setup.ts`

```ts
registry.register('hero-banner',  HeroBannerBlock)
registry.register('rich-text',    RichTextBlock)
registry.register('card-grid',    CardGridBlock)
registry.register('features',     FeaturesBlock)
registry.register('cta',          CTABlock)
registry.register('testimonials', TestimonialsBlock)
registry.register('faq',          FAQBlock)
registry.register('pricing',      PricingBlock)
```

Imported once in `src/app/(frontend)/layout.tsx`.

---

## Type System

**File:** `src/validation/types.ts`

### Core schema types

```ts
interface BlockSchema {
  fields: BlockField[]
  layout?: 'default' | 'sidebar' | 'tabs'
}

type FieldType =
  | 'text' | 'textarea' | 'richtext'
  | 'number' | 'checkbox'
  | 'select' | 'multiselect'
  | 'date' | 'image' | 'file' | 'url' | 'email' | 'color'
  | 'array' | 'group' | 'relationship' | 'json'
  | 'blocks'
```

### Conditional logic types

```ts
type ConditionOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than'
  | 'in' | 'not_in'
  | 'exists' | 'empty'

interface ConditionRule {
  field: string           // dot-notation path to sibling field value
  operator: ConditionOperator
  value?: unknown         // not required for 'exists' / 'empty'
}
```

### Validation rules

```ts
interface ValidationRules {
  required?: boolean
  minLength?: number; maxLength?: number   // text, textarea, url, email
  min?: number; max?: number               // number
  minRows?: number; maxRows?: number       // array
  regex?: RegExp                           // text, textarea, url, email
  step?: number                            // number — value must be a multiple of step
  integerOnly?: boolean                    // number
  uniqueItems?: boolean                    // array — no duplicate rows (shallow JSON equality)
  maxSelections?: number                   // multiselect
  maxFileSize?: number                     // file, image — max bytes
  allowedMimeTypes?: string[]              // file
}
```

### UI metadata

```ts
type UIWidth = 'full' | 'half' | 'third' | 'quarter'

interface UIMetadata {
  tab?: string        // tab name (default 'General')
  section?: string    // section within tab (default 'General')
  width?: UIWidth     // grid column width
  collapsed?: boolean // start collapsed in admin
  order?: number      // sort order within section
}
```

### BaseField

```ts
interface BaseField {
  name: string
  type: FieldType
  label?: string
  required?: boolean
  conditions?: ConditionRule[]
  conditionMode?: 'AND' | 'OR'       // default 'AND'
  validation?: ValidationRules
  ui?: UIMetadata
  admin?: { description?; readOnly?; hidden?; placeholder?; condition? }
}
```

Type-specific interfaces extend `BaseField` with their own constraints:

| Interface | Key additions |
|-----------|---------------|
| `TextField` | `minLength`, `maxLength` |
| `NumberField` | `min`, `max` |
| `SelectField` | `options: { label, value }[]` |
| `MultiSelectField` | `options`, `maxSelections` |
| `ArrayField` | nested `fields`, `minRows`, `maxRows` |
| `GroupField` | nested `fields` |
| `RelationshipField` | `collection`, `hasMany` |
| `FileField` | `allowedMimeTypes` |
| `DateField` | `timeFormat` |
| `BlocksField` | `allowedBlocks?`, `minBlocks?`, `maxBlocks?` |

### Nested block types

```ts
interface BlocksField extends BaseField {
  type: 'blocks'
  allowedBlocks?: string[]   // slugs of block definitions that can be nested
  minBlocks?: number
  maxBlocks?: number
}

interface NestedBlockValue {
  id?: string
  blockType: string          // slug of the nested block definition
  data: BlockData
}
```

`BlockField` is a union of all typed field interfaces. `BlockData` is `Record<string, unknown>`.

---

## Validation Layer

### Schema Validation
**File:** `src/validation/schemaValidator.ts`

`validateBlockSchema(schema: unknown): ValidationResult`

- Checks `fields` array is non-empty
- Validates field names (alphanumeric + underscore, starts with letter), types, and labels
- Type-specific rules: select options, number min/max, nested field recursion, duplicate name detection
- Validates `conditions` array: operator values, field name presence
- Validates `validation` object: numeric types, regex compilability, boolean flags
- Validates `ui` object: width values, numeric order
- For `blocks` fields: validates `allowedBlocks` slug array, `minBlocks`/`maxBlocks` types
- Returns `{ valid, errors, warnings }`

### Data Validation
**File:** `src/validation/dataValidator.ts`

`validateBlockData(schema: BlockSchema, data: BlockData): DataValidationResult`

- Validates instance data against its schema (required fields, type coercion, nested array/group/blocks recursion)
- `mergeValidation(field): ValidationRules` — merges direct field props with `field.validation.*`; the `validation` object takes precedence when both specify the same constraint
- Applies extended rules: `regex` match, `step` multiple check, `integerOnly` via `Number.isInteger`, `uniqueItems` via JSON-serialized dedup, `maxSelections`, `maxFileSize`
- For `blocks` fields: validates `minBlocks`/`maxBlocks` counts and `allowedBlocks` membership
- Returns `{ valid, errors: [{ path, message }] }`

### Condition Evaluation
**File:** `src/validation/evaluateConditions.ts`

`evaluateConditions(conditions: ConditionRule[], mode: 'AND' | 'OR', formData: Record<string, unknown>): boolean`

- Returns `true` when the field should be **visible** (conditions pass)
- Uses `getValueByPath()` for dot-notation field paths
- `equals`/`not_equals` use loose equality (`==`) to handle string/number coercion
- `in`/`not_in` cast `value` to array
- `exists` checks `!= null && !== ''`; `empty` is its inverse
- With `AND` mode: all conditions must pass; with `OR` mode: any condition suffices

---

## Builder & Schema Persistence

### Normalizer
**File:** `src/builder/normalizer.ts`

`normaliseSchema(raw: RawSchemaInput): BlockSchema`

Leniently pre-processes raw input before strict validation:
- Coerces unknown field types → `'text'`
- Normalizes option shorthand strings → `{ label, value }` objects
- Recursively handles nested fields
- Passes through `conditions`, `conditionMode`, `validation`, `ui` unchanged
- For `blocks` fields: passes through `allowedBlocks`, `minBlocks`, `maxBlocks`

### Form Layout Builder
**File:** `src/builder/buildFormLayout.ts`

`buildFormLayout(schema: BlockSchema): FormLayout`

Groups schema fields (excluding `admin.hidden`) into a tab → section → field hierarchy:
- Fields without `ui.tab` fall into the `'General'` tab
- Fields without `ui.section` fall into the `'General'` section
- Fields are sorted by `ui.order` within each section
- Returns `FormLayout` — an ordered array of `FormTab` objects, each containing `FormSection` objects, each containing `FormFieldEntry` objects

`hasUIMetadata(schema: BlockSchema): boolean`

Returns `true` only when at least one field has `ui.tab`, `ui.section`, `ui.width`, or `ui.order` set. `collapsed`-only metadata does not trigger the tabbed layout. This guard ensures backward compatibility — schemas without layout metadata continue rendering in the flat column layout.

`widthToStyle(width: UIWidth): string`

Maps width values to CSS calc strings:
| Width | CSS |
|-------|-----|
| `'full'` | `'100%'` |
| `'half'` | `'calc(50% - 8px)'` |
| `'third'` | `'calc(33.333% - 11px)'` |
| `'quarter'` | `'calc(25% - 12px)'` |

### Schema Save
**File:** `src/builder/saveSchema.ts`

**`saveSchemaLocally(payload, request)`** — Server-side (hooks, route handlers):
1. Normalizes via `normaliseSchema()`
2. Validates via `validateBlockSchema()`
3. Finds or creates `BlockDefinition` by slug
4. Creates immutable `BlockDefinitionVersion`
5. Returns `{ success, definitionId, versionId, versionNumber, errors, warnings }`

Note: `definitionId` and `versionId` are returned as strings via `String(id)`. For Postgres, relationship fields require integer IDs — use `parseInt(id, 10)` before passing to `payload.create()`.

**`saveSchemaViaHttp(request, options)`** — For external tools (CLI, browser): POSTs to `/api/blocks/save` with Bearer token auth.

---

## Visual Block Builder

A drag-and-drop GUI for designing block schemas visually. It runs **inside this project** at `http://localhost:3000/block-builder` — no separate process or port required. All source files live under `src/block-builder/` and `src/app/block-builder/`.

### Architecture Overview

| Layer | Location | Description |
|-------|----------|-------------|
| Page route | `src/app/block-builder/page.tsx` | Server component; reads `?load=` search param, passes to `BuilderShell` |
| Layout | `src/app/block-builder/layout.tsx` | Standalone `<html>/<body>` layout (isolated from the frontend/admin layout trees); imports `builder.css` |
| CSS | `src/app/block-builder/builder.css` | `@import "tailwindcss"` + CSS variables (dark palette with `--payload-accent: #e6c129`) + scrollbar/animation styles |
| Zustand store | `src/block-builder/store/builder.store.ts` | Immer + persist middleware; owns `blocks[]`, `activeBlockId`, `activeFieldId`, `isDirty` |
| Types | `src/block-builder/types.ts` | `FieldType`, `FieldDefinition`, `BlockDefinition`, `BuilderState`, `GeneratedOutput` |
| Field palette | `src/block-builder/lib/field-palette.ts` | 18 field type entries with categories and Tailwind color classes |
| Code generator | `src/block-builder/lib/codegen.ts` | ts-morph based AST code generation (Node.js-only — called server-side via API route) |
| Save bridge | `src/block-builder/lib/mapToSaveRequest.ts` | Converts builder `BlockDefinition` → `SaveSchemaRequest` for `POST /api/blocks/save` |
| Load converter | `src/block-builder/lib/schemaToBuilderBlock.ts` | Converts DB schema fields (`RawFieldInput[]`) back into builder `BlockDefinition` |
| Utils | `src/block-builder/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |

### Zustand Store — `builder.store.ts`

State shape:
```ts
type BuilderState = {
  blocks: BlockDefinition[]
  activeBlockId: string | null
  activeFieldId: string | null
  isDirty: boolean
}
```

Key actions:
- `addBlock` / `removeBlock` / `updateBlock` / `duplicateBlock`
- `addField(blockId, type)` / `removeField` / `updateField` / `reorderFields(blockId, fromIndex, toIndex)`
- `setActiveBlock` / `setActiveField`
- `reset()` — clear all blocks; `markClean()` — clear dirty flag
- `loadBlock(block)` — replaces the store with a single loaded block and sets it as active (used by the `?load=` URL param flow)

Middleware: `devtools` + `persist` (localStorage key `"payload-block-builder"`) + `immer`

### Type Mappings

**Builder → DB (`mapToSaveRequest.ts`):**

| Builder type | DB type (RawFieldInput) |
|---|---|
| `richText` | `richtext` |
| `upload` | `image` |
| `radio` | `select` |
| `code`, `point`, `ui`, `tabs`, `collapsible` | stripped (unsupported) |
| all others | pass through |

**DB → Builder (`schemaToBuilderBlock.ts`):**

| DB type | Builder type |
|---|---|
| `richtext` | `richText` |
| `image` | `upload` |
| all others | pass through |

Each field loaded from DB gets a fresh `uuidv4()` added as its `id`.

### Components

**`BuilderShell`** (`src/block-builder/components/canvas/BuilderShell.tsx`) — Root client component. Renders `TopBar`, `FieldPalette` (sidebar), `BuilderCanvas` / `BlockList` (main area), and `ConfigPanel` / `BlockConfig` / `FieldConfig` (right panel). When `loadSlug` prop is present, fires a `useEffect` on mount to:
1. `GET /api/block-builder/load/<slug>` (session cookie auto-sent, same origin)
2. Calls `loadBlock(block)` on success to seed the store
3. Shows a loading banner and error banner as appropriate

**`TopBar`** — Two action buttons:
- **Export .ts** → calls `POST /api/block-builder/generate` → downloads TypeScript files
- **Publish to Payload** → calls `POST /api/blocks/save` for each block via `mapToSaveRequest()`, shows per-block success/error status bar

**`CodePreview`** — Fetches generated code from `POST /api/block-builder/generate` (not direct ts-morph import) so ts-morph stays server-only.

**`SortableFieldCard`** — Drag handles via `@dnd-kit/sortable`. `AlertCircle` icon wrapped in `<span title="...">` (lucide-react v1 does not type the `title` prop).

### API Routes

**`POST /api/block-builder/generate`** (`src/app/api/block-builder/generate/route.ts`)

Server-side TypeScript code generation using ts-morph. Accepts `{ blocks: BlockDefinition[] }`, returns `{ files: GeneratedOutput[] }`. No auth required (output is just code strings).

**`GET /api/block-builder/load/[slug]`** (`src/app/api/block-builder/load/[slug]/route.ts`)

Loads an existing block definition for editing. Auth: `payload.auth({ headers })` accepts session cookie or Bearer token.
1. Finds the `block-definitions` record by slug (`depth: 2` to resolve `currentVersion`)
2. Reads `currentVersion.schema.fields`
3. Converts via `schemaToBuilderBlock()` → builder `BlockDefinition`
4. Returns `{ block }`

### Re-Versioning Workflow

The complete round-trip for editing an existing block and publishing a new version:

```
Admin: /admin/collections/block-definitions → open block
  → "Edit in Block Builder" button appears at bottom of detail page
  → click → /block-builder?load=<slug> opens in new tab

BuilderShell mounts with loadSlug=<slug>
  → GET /api/block-builder/load/<slug>
      → payload.auth() — cookie auth (same origin)
      → payload.find({ collection: 'block-definitions', where: { slug } })
      → resolves currentVersion (depth: 2)
      → schemaToBuilderBlock(slug, name, labels, fields)
      → returns { block }
  → loadBlock(block) → Zustand store seeded

User edits fields visually, drags new ones in

Clicks "Publish to Payload"
  → mapToSaveRequest(block) → SaveSchemaRequest
  → POST /api/blocks/save
      → saveSchemaLocally() detects existing slug
      → creates new immutable BlockDefinitionVersion (v2, v3, ...)
      → updates BlockDefinition.currentVersion → new version

Back in admin: block definition's currentVersion now points to new version
```

**Key invariant:** `saveSchemaLocally()` always creates a new version on every publish with the same slug — the re-versioning flow requires no special handling. The load API + `schemaToBuilderBlock` + `loadBlock` action complete the missing "load existing" half of the round-trip.

### Dependencies Added

```json
"zustand": "^5.x",
"immer": "^10.x",
"ts-morph": "^24.x",
"prettier": "^3.x",
"@dnd-kit/modifiers": "^9.x",
"uuid": "^11.x",
"clsx": "^2.x",
"tailwind-merge": "^3.x",
"lucide-react": "^0.x"
```

---

## Renderer System

### Block Registry
**File:** `src/renderer/registry.ts`

Singleton `BlockRegistry` maps slugs to React components:

```ts
registry.register('hero-banner', HeroBannerBlock)
registry.get('hero-banner')        // → component or undefined
registry.has('hero-banner')        // → boolean
registry.list()                    // → string[]
registry.registerMany({ ... })
```

**Registration:** `src/blocks/registry-setup.ts` — import once in the frontend entry point (`src/app/(frontend)/layout.tsx`).

Current registered runtime block components:

| Slug | Component |
|------|-----------|
| `hero-banner` | `HeroBannerBlock` |
| `rich-text` | `RichTextBlock` |
| `card-grid` | `CardGridBlock` |
| `features` | `FeaturesBlock` |
| `cta` | `CTABlock` |
| `testimonials` | `TestimonialsBlock` |
| `faq` | `FAQBlock` |
| `pricing` | `PricingBlock` |

### DynamicRenderer
**File:** `src/renderer/DynamicRenderer.tsx`

`DynamicRenderer({ layout, customFallback })`

Iterates over a page's `dbLayout` array:
1. Looks up component in registry by `blockDefinition.slug`
2. Renders component with `data`, `schema`, `instanceId`, `anchor` props
3. Falls back to `FallbackRenderer` for unregistered slugs
4. Skips `hidden` blocks; applies `anchor` as HTML `id`

### NestedBlocksRenderer
**File:** `src/renderer/DynamicRenderer.tsx`

`NestedBlocksRenderer({ blocks, depth?, maxDepth?, customFallback? })`

Renders the value of a `blocks` schema field from inside a block component. Block components that contain a `blocks` data field call this utility to render their children via the same registry.

- Enforces a maximum nesting depth (`maxDepth`, default 3) — returns `null` and warns in dev when exceeded
- Looks up each nested block's component from the registry by `blockType`
- Falls back to `FallbackRenderer` for unregistered nested block types

```tsx
import { NestedBlocksRenderer } from '@/renderer'

export function SectionBlock({ data }) {
  return (
    <section>
      <h2>{data.title}</h2>
      <NestedBlocksRenderer blocks={data.children} />
    </section>
  )
}
```

### FieldRenderer
**File:** `src/renderer/FieldRenderer.tsx`

`FieldRenderer({ value, fieldType, label, schema })`

Renders individual field values by type:
- `text/textarea` → `<span>`/`<p>`
- `url/email` → `<a>` links
- `image` → `<img>`
- `richtext` → `dangerouslySetInnerHTML`
- `array` / `group` → recursive rendering
- `color` → colored swatch
- `json` → `<pre>` block

### FallbackRenderer
**File:** `src/renderer/FallbackRenderer.tsx`

Renders block data when no registered component exists. Dev mode shows a warning banner; always renders fields via `FieldRenderer` so the page never breaks.

---

## API Routes

### `POST /api/blocks/save`
**File:** `src/app/api/blocks/save/route.ts`

Saves / publishes block schemas to the DB. Auth: `payload.auth({ headers })` — accepts both a `Bearer` token (external tools/CLI) and a Payload session cookie (same-origin browser requests from `/block-builder`).

```ts
// Request
{ blockSlug, name?, description?, category?, schema: BlockSchema, changelog? }

// Response (201)
{ success, definitionId, versionId, versionNumber, errors?, warnings? }
```

### `POST /api/blocks/preview`
**File:** `src/app/api/blocks/preview/route.ts`

Validates block instance data and returns the schema/data pair for an admin preview client. Requires Payload session auth.

```ts
// Request
{ blockSlug, versionId, data: Record<string, unknown> }

// Response
{ valid: true, schema: BlockSchema, data: Record<string, unknown> }
```

### `POST /api/block-builder/generate`
**File:** `src/app/api/block-builder/generate/route.ts`

Server-side TypeScript code generation using ts-morph. Called by the builder's "Export .ts" button and `CodePreview` component (ts-morph is Node.js-only and cannot run in the browser).

```ts
// Request
{ blocks: BlockDefinition[] }

// Response
{ files: GeneratedOutput[] }   // GeneratedOutput: { filename, code, language }
```

### `GET /api/block-builder/load/[slug]`
**File:** `src/app/api/block-builder/load/[slug]/route.ts`

Loads an existing block's current schema in builder-compatible format. Used by `BuilderShell` when the page is opened with `?load=<slug>`. Auth: session cookie or Bearer token.

```ts
// Response (200)
{ block: BlockDefinition }

// Error (401)
{ error: "Unauthorized" }

// Error (404)
{ error: "Block \"<slug>\" not found" }
{ error: "Block \"<slug>\" has no published version" }
```

### `GET /api/draft`
**File:** `src/app/api/draft/route.ts`

Enables Next.js Draft Mode so the frontend can render unpublished pages inside the admin Live Preview iframe. Requires an authenticated Payload session — unauthenticated requests receive a 401.

1. Authenticates the caller via `payload.auth({ headers })`
2. Calls `draftMode().enable()` — sets the `__prerender_bypass` cookie
3. Redirects to `/<slug>` (the actual frontend page)

Called automatically by the `livePreview.url` function in `payload.config.ts` when the admin panel opens the Live Preview iframe.

### `GET /api/exit-draft`
**File:** `src/app/api/exit-draft/route.ts`

Clears the Draft Mode cookie and redirects back to the page. Visiting `/api/exit-draft?slug=about-us` restores normal published-only rendering for the current browser session.

### `GET /api/internal/locales`
**File:** `src/app/api/internal/locales/route.ts`

Returns enabled locale codes and the default code for Edge middleware (cannot use Postgres directly in middleware).

```ts
// Response
{ codes: string[], defaultCode: string }
```

Cached `public, s-maxage=60`. Falls back to `{ codes: ['en'], defaultCode: 'en' }` on DB error.

### `POST /api/admin/duplicate-page-locale`
**File:** `src/app/api/admin/duplicate-page-locale/route.ts`

Creates a draft translation of an existing page in another locale. Auth: Payload session via `payload.auth({ headers })`.

```ts
// Request
{ pageId: string | number, targetLocaleId: string | number }

// Success (200)
{ success: true, pageId, slug }

// Errors
401 Unauthorized
400 Missing body / no translationGroupId / same locale / ValidationError
404 Source page or target locale not found
409 Translation or homepage slug conflict — may include existingId
```

Delegates to `duplicatePageForLocale()` in `src/lib/admin/duplicatePageForLocale.ts`.

---

### Payload REST API
**File:** `src/app/(payload)/api/[...slug]/route.ts`

Payload's generated REST handlers expose collection and auth endpoints through the App Router.

```ts
export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const OPTIONS = REST_OPTIONS(config)
```

### Payload GraphQL API
**File:** `src/app/(payload)/api/graphql/route.ts`

GraphQL is enabled with `GRAPHQL_POST(config)` and the playground GET route. The generated schema is written to `generated-schema.graphql`.

---

## Frontend Routing

### `[locale]/[[...slug]]` Catch-All Page
**File:** `src/app/(frontend)/[locale]/[[...slug]]/page.tsx`

Middleware rewrites unprefixed URLs to include the default locale segment internally; the browser may show `/` for default locale and `/ur/...` for others.

| Browser path | Internal locale | Resolved slug |
|--------------|-----------------|---------------|
| `/` | `en` (default) | `"/"` |
| `/about-us` | `en` | `"about-us"` |
| `/ur` | `ur` | `"/"` |
| `/ur/about-us` | `ur` | `"about-us"` |

- Checks `draftMode().isEnabled` from `next/headers` on every request
- `getPage(slug, localeCode, isDraft)` resolves the `locales` doc by `code`, then queries `pages` with `slug`, `locale`, and `status: 'published'` unless draft mode is on (`depth: 3`)
- Generates metadata from `page.seo`; builds **hreflang** alternates from pages sharing `translationGroupId`
- Renders `<RenderHero>`, `<DynamicRenderer>`, `<RenderContentBlocks>`; static `HomePageContent` fallback when no CMS page exists at `/`
- Renders `<LivePreviewListener>` only when draft mode is enabled
- Outer shell (`html`, header, footer) is provided by `[locale]/layout.tsx`

---

## Payload Configuration

**File:** `payload.config.ts`

```ts
buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Block System' },
    livePreview: {
      url: ({ data }) => {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const slug = (data?.slug as string) ?? '/'
        const localeCode = (data?.locale as { code?: string } | null)?.code ?? 'en'
        return `${serverUrl}/api/draft?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(localeCode)}`
      },
      collections: ['pages'],
      breakpoints: [
        { label: 'Mobile',  name: 'mobile',  width: 375,  height: 667  },
        { label: 'Tablet',  name: 'tablet',  width: 768,  height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900  },
      ],
    },
  },
  collections: [Locales, HeaderLocales, FooterLocales, BlockDefinitions, BlockDefinitionVersions, Pages, Media, SavedSections, Users],
  globals: [Header, Footer, Theme],
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ?? 'postgresql://localhost:5432/payload_dynamic_blocks',
    },
  }),
  sharp,
  secret: process.env.PAYLOAD_SECRET ?? 'CHANGE_ME_IN_PRODUCTION',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql') },
})
```

### Next.js Configuration
**File:** `next.config.mjs`

Next is wrapped with `withPayload(nextConfig)`. Image optimization currently allows remote images from `http://localhost`.

---

## Custom Admin Field Components

Payload 3.x supports replacing any field's admin UI with a custom React component via `admin.components.Field`. These components use `'use client'` and the `@payloadcms/ui` hooks to read/write field values.

**Import map:** `src/app/(payload)/admin/importMap.js` — auto-generated by `pnpm payload generate:importmap`. Maps component string paths (e.g. `'@/components/BlockDataField#BlockDataField'`) to actual React component references.

---

### TranslationStatus
**File:** `src/components/admin/TranslationStatus.tsx`

Sidebar `ui` field on `pages`. When `translationGroupId` exists, fetches sibling pages in the same group and all **enabled** locales. Lists each locale with **Open** (if translated), **Create** (triggers `#translate-to-locale-btn`), or **current** marker. Shows a save-first hint when the group ID is not yet generated.

---

### DuplicateForLocale
**File:** `src/components/admin/DuplicateForLocale.tsx`

Sidebar **Translate to…** button (`id="translate-to-locale-btn"`). Modal loads enabled locales and existing translations in the group. Rows:

- **Current page** — disabled, not selectable
- **Already translated** — link to existing page
- **Available** — radio selection for new translation

POSTs to `/api/admin/duplicate-page-locale` with numeric `targetLocaleId` when possible. On 409, redirects to `existingId`.

---

### EditInBuilderButton
**File:** `src/components/EditInBuilderButton/index.tsx`

A `'use client'` component rendered inside the `block-definitions` admin detail form via a `ui` field. Reads the document's `slug` using `useField<string>({ path: 'slug' })` and the document `id` via `useDocumentInfo()`. Renders nothing on unsaved documents (no `id` yet).

When both `id` and `slug` are present, renders a link button:
```
/block-builder?load=<slug>   (opens in new tab)
```

This is the entry point for the [re-versioning workflow](#re-versioning-workflow) — click to load the block's current schema into the visual builder.

**Registration:** Added as a `ui` field in `BlockDefinitions.ts`:
```ts
{
  name: 'editInBuilderButton',
  type: 'ui',
  admin: { components: { Field: '@/components/EditInBuilderButton#EditInBuilderButton' } },
}
```

Listed in `src/app/(payload)/admin/importMap.js` (auto-regenerated via `pnpm generate:importmap`).

---

### SchemaBuilderField
**Files:** `src/components/SchemaBuilderField/`

Visual schema builder for the `schema` field in `block-definition-versions`. Replaces the raw JSON textarea so editors can add/configure fields one at a time.

Registered in `BlockDefinitionVersions.ts`:
```ts
admin: {
  components: { Field: '@/components/SchemaBuilderField#SchemaBuilderField' },
}
```

**Hydration pattern** — differentiates create vs edit mode:
```ts
const hasExistingValue = value !== undefined && value !== null
const [hydrated, setHydrated] = useState(!hasExistingValue)
// hydrated = true in create mode → sync effect fires immediately
// hydrated = false in edit mode → wait for value to arrive, then parse once
```

| File | Purpose |
|------|---------|
| `index.tsx` | Root component; owns `FieldDef[]` state, syncs to Payload field via `setValue({ fields })` |
| `FieldRow.tsx` | Single field card: name (auto-slugified), type dropdown (18 types), label, required; always-visible `OptionsEditor`/`NestedFieldsEditor`/blocks config for matching types; four expandable sub-panels for advanced options |
| `OptionsEditor.tsx` | Editable `{label, value}` pairs for `select`/`multiselect` field types |
| `NestedFieldsEditor.tsx` | Recursive nested field list for `array`/`group` types; reuses `FieldRow`, max depth 3 |

**FieldDef (internal state):**
```ts
interface FieldDef {
  name: string; type: FieldType; label: string; required: boolean
  options?: { label: string; value: string }[]   // select, multiselect
  fields?: FieldDef[]                             // array, group (recursive)
  min?: number; max?: number                      // number
  minLength?: number; maxLength?: number          // text, textarea
  minRows?: number; maxRows?: number              // array
  collection?: string; hasMany?: boolean          // relationship
  allowedMimeTypes?: string                       // file
  timeFormat?: boolean                            // date
  allowedBlocks?: string[]                        // blocks
  minBlocks?: number; maxBlocks?: number          // blocks
  conditions?: ConditionRule[]
  conditionMode?: 'AND' | 'OR'
  validation?: ValidationRules
  ui?: UIMetadata
  admin?: { description?; placeholder?; readOnly?; hidden? }
}
```

Serialised output: `{ fields: FieldDef[] }` — matches `BlockSchema` exactly.

**FieldRow expandable panels (always collapsed by default):**

1. **Advanced options** — existing type-specific inputs (options, nested fields, number bounds, mime types, etc.)
2. **Validation Rules** — `regex`, `step`, `integerOnly`, `maxSelections`, `uniqueItems`, `maxFileSize`
3. **UI Layout** — `tab`, `section`, `width` (select), `order`, `collapsed` checkbox
4. **Conditional Visibility** — conditions list (field path + operator + value per rule), AND/OR mode toggle; `exists`/`empty` operators hide the value input

**Blocks field (type `'blocks'`):** When `type === 'blocks'` is selected, an always-visible panel appears for `allowedBlocks` slugs (comma-separated input) and `minBlocks`/`maxBlocks` numeric inputs, independent of the expandable advanced panel.

---

### BlockDataField
**Files:** `src/components/BlockDataField/`

Schema-driven dynamic form for the `data` field in each `pages` layout block instance. Replaces the raw JSON textarea so editors fill in typed inputs that match the pinned schema version.

Registered in `Pages.ts`:
```ts
admin: {
  components: { Field: '@/components/BlockDataField#BlockDataField' },
}
```

**How it works:**
1. Watches sibling `blockVersion` field via `useFormFields` — path derived as `path.replace(/\.data$/, '.blockVersion')`
2. Fetches schema from `/api/block-definition-versions/:id?depth=0` when `blockVersion` changes
3. Strips orphaned keys (keys in saved `data` not present in new schema) using `useRef` to avoid stale closures
4. Renders `SchemaForm` → `FieldInput` → type-specific inputs

| File | Purpose |
|------|---------|
| `index.tsx` | Root; watches blockVersion, fetches schema, cleans orphaned keys, calls `setValue` |
| `SchemaForm.tsx` | Iterates `schema.fields[]`; evaluates conditions per field; renders flat column or tabbed/grid layout |
| `FieldInput.tsx` | Switch on `field.type` → appropriate HTML input; handles all 18 field types |
| `ArrayFieldInput.tsx` | Repeatable row list with Add/Remove; each row rendered via `SchemaForm` recursively |
| `GroupFieldInput.tsx` | Nested object rendered via `SchemaForm` |
| `MediaPickerInput.tsx` | Full media upload + library picker (see below) |
| `BlocksFieldInput.tsx` | Nested block instance list with Add/Remove/Reorder; fetches schemas for allowed block slugs |
| `InsertBlockModal.tsx` | Modal for picking a block type when adding a new block instance to a `blocks` field |

**SchemaForm layout logic:**

- If `hasUIMetadata(schema)` is `true`: renders a tabbed layout built from `buildFormLayout(schema)`. Each tab contains sections; each section renders fields in a `flex-wrap` grid where `widthToStyle(field.ui.width)` sets the inline width. The tab bar is hidden when there is only one tab; section headers are hidden for trivial single `'General'` sections.
- Otherwise: renders fields in a flat column (unchanged behavior for schemas without UI metadata).

In both layouts, `evaluateConditions(field.conditions, field.conditionMode, currentData)` is called before rendering each field. If it returns `false`, the field is skipped (not rendered). Its saved value is preserved in `data`; only orphaned keys absent from the schema are cleaned.

**BlocksFieldInput behavior:**

- On mount, batch-fetches schemas for all `allowedBlocks` slugs via `GET /api/block-definitions?where[slug][in][0]=slug1&where[slug][in][1]=slug2&depth=2`
- Stores schemas in `Record<string, BlockSchema | null>` where `null` = fetched but not found
- Each block instance renders as a collapsible card with a `SchemaForm` inside
- "Add Block" button opens a dropdown listing allowed slugs; selecting one appends a new `NestedBlockValue` with a generated `id`
- Supports collapse toggle, move up/down, and remove per block instance
- Dropdown closes on outside click via a `useEffect` click-outside handler

**Two-step upload flow in `MediaPickerInput`:**
1. User selects file → local preview via `URL.createObjectURL()` + inline alt text input shown
2. User enters alt text → clicks Upload → POST with `_payload: JSON.stringify({ alt })` (Payload 3.x multipart format)
3. Upload button disabled until alt text is non-empty
4. On success: stores media document ID as field value; shows thumbnail preview
5. "Choose from library" button: modal grid fetching `/api/media?limit=50`

---

## Admin Layout

**File:** `src/app/(payload)/layout.tsx`

```tsx
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'

const Layout = ({ children }) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)
```

Uses pre-built CSS (`@payloadcms/next/css`) — no Sass required.

---

## Seed Script

**File:** `src/scripts/seed.ts`

Run with `pnpm seed`. Loads `.env` via `import 'dotenv/config'` (tsx does not auto-load env files).

### What it does

1. **Registers 8 block definitions** — calls `saveSchemaLocally()` for every registered block. Schemas are imported directly from the component files so the seed stays in sync with the components. If a definition already exists, its name/description/category is updated and a new version is created; otherwise it is created fresh.

   | Slug | Category |
   |------|----------|
   | `hero-banner` | layout |
   | `rich-text` | content |
   | `card-grid` | content |
   | `features` | content |
   | `cta` | content |
   | `testimonials` | content |
   | `faq` | content |
   | `pricing` | content |

2. **Resolves default locale** — finds `locales` where `isDefault: true`; exits with error if none exists.

3. **Creates the home page demo** — after all definitions succeed, checks if a page with `slug: '/'` already exists:
   - **Exists with ≥ 4 blocks** → skips update (already seeded)
   - **Exists with < 4 blocks** → updates with the full 6-block demo (catches legacy 3-block seed)
   - **Doesn't exist** → creates it (`status: 'published'`, `locale: defaultLocale.id`)

   The demo page uses preset data (`[preset][0].data`) for each block:

   | Order | Block | Preset |
   |-------|-------|--------|
   | 1 | Hero Banner | `heroBannerPresets[0]` — centered gradient hero |
   | 2 | Features | `featuresPresets[0]` — SaaS features, 3-column grid |
   | 3 | Testimonials | `testimonialsPresets[0]` — 6-card default grid |
   | 4 | Pricing | `pricingPresets[0]` — 3-tier SaaS pricing |
   | 5 | FAQ | `faqPresets[0]` — product FAQ, single column |
   | 6 | CTA | `ctaPresets[0]` — bottom-of-page CTA |

   Relationship fields (`blockDefinition`, `blockVersion`) require integer IDs for the Postgres adapter. The `definitionId` and `versionId` strings returned by `saveSchemaLocally()` are converted with `parseInt()` (via `toId()` helper) before being passed to `payload.create()`.

---

## Project File Structure

```
payload/
├── payload.config.ts
├── package.json
├── next.config.mjs
├── postcss.config.mjs
├── architecture.md
│
└── src/
    ├── app/
    │   ├── (frontend)/
    │   │   ├── [locale]/
    │   │   │   ├── layout.tsx           # Locale shell — header/footer per locale, theme, RTL
    │   │   │   ├── [[...slug]]/page.tsx # Catch-all page renderer
    │   │   │   └── _home/HomePageContent.tsx
    │   │   ├── layout.tsx               # Root — CSS + block registry only
    │   │   └── globals.css
    │   ├── middleware.ts                # Locale prefix redirect / rewrite
    │   ├── (payload)/
    │   │   ├── admin/[[...segments]]/   # Payload admin UI
    │   │   ├── api/[...slug]/route.ts   # Payload API catch-all
    │   │   ├── api/graphql/route.ts     # Payload GraphQL route
    │   │   └── layout.tsx               # Admin root layout (RootLayout)
    │   ├── block-builder/
    │   │   ├── page.tsx                 # /block-builder — reads ?load= param
    │   │   ├── layout.tsx               # Standalone html/body layout; imports builder.css
    │   │   └── builder.css             # Tailwind @import + CSS variables (dark palette)
    │   └── api/
    │       ├── blocks/
    │       │   ├── save/route.ts        # POST /api/blocks/save
    │       │   └── preview/route.ts     # POST /api/blocks/preview
    │       ├── block-builder/
    │       │   ├── generate/route.ts    # POST /api/block-builder/generate — ts-morph codegen
    │       │   └── load/[slug]/route.ts # GET  /api/block-builder/load/:slug
    │       ├── draft/route.ts           # GET  /api/draft   — enables Next.js Draft Mode
    │       ├── exit-draft/route.ts      # GET  /api/exit-draft — disables Draft Mode
    │       ├── internal/locales/route.ts # GET enabled locale codes (middleware)
    │       └── admin/duplicate-page-locale/route.ts # POST page translation
    │
    ├── collections/
    │   ├── Locales.ts
    │   ├── HeaderLocales.ts
    │   ├── FooterLocales.ts
    │   ├── BlockDefinitions.ts
    │   ├── BlockDefinitionVersions.ts
    │   ├── Pages.ts
    │   ├── Media.ts
    │   └── index.ts
    ├── lib/
    │   ├── locale/                      # getLocales, validateLocale, LocaleProvider
    │   ├── payload/coerceRelationshipId.ts
    │   └── admin/duplicatePageForLocale.ts
    ├── migrations/
    │   └── 20250514000000_locale_system.ts
    │
    ├── globals/
    │   ├── Header.ts                    # Navigation, logo, CTA button, sticky toggle
    │   ├── Footer.ts                    # Link columns, social links, copyright
    │   └── index.ts
    │
    ├── heros/
    │   ├── config.ts                    # Payload-native hero group field
    │   ├── RenderHero.tsx               # Selects hero renderer by type
    │   ├── HighImpact/index.tsx
    │   ├── MediumImpact/index.tsx
    │   └── LowImpact/index.tsx
    │
    ├── fields/
    │   ├── defaultLexical.ts            # Shared Lexical editor config
    │   ├── link.ts                      # Link group field
    │   └── linkGroup.ts                 # CTA links array field
    │
    ├── hooks/
    │   ├── populateBlockData.ts
    │   ├── populatePublishedAt.ts
    │   └── revalidateRedirects.ts
    │
    ├── validation/
    │   ├── types.ts                     # BlockSchema, field types, ConditionRule, ValidationRules, UIMetadata, BlocksField, NestedBlockValue
    │   ├── schemaValidator.ts           # validateBlockSchema()
    │   ├── dataValidator.ts             # validateBlockData(), mergeValidation()
    │   ├── evaluateConditions.ts        # evaluateConditions()
    │   └── index.ts
    │
    ├── block-builder/                   # Visual block builder (integrated)
    │   ├── types.ts                     # FieldType, FieldDefinition, BlockDefinition, BuilderState
    │   ├── store/
    │   │   └── builder.store.ts         # Zustand store (immer + persist); loadBlock() action
    │   ├── lib/
    │   │   ├── utils.ts                 # cn() — clsx + tailwind-merge
    │   │   ├── field-palette.ts         # 18 field types with categories and color classes
    │   │   ├── codegen.ts               # ts-morph code generator (Node.js-only, server-side)
    │   │   ├── mapToSaveRequest.ts      # BlockDefinition → SaveSchemaRequest (builder → DB)
    │   │   └── schemaToBuilderBlock.ts  # RawFieldInput[] → BlockDefinition (DB → builder)
    │   └── components/
    │       ├── canvas/
    │       │   ├── BuilderShell.tsx     # Root; accepts loadSlug prop; seeds store on mount
    │       │   ├── TopBar.tsx           # Export .ts + Publish to Payload buttons
    │       │   ├── BuilderCanvas.tsx    # Main canvas with sortable fields
    │       │   ├── BlockList.tsx        # Renders the list of blocks
    │       │   ├── SortableFieldCard.tsx
    │       │   ├── ConfigPanel.tsx      # Right-side configuration panel
    │       │   └── CodePreview.tsx      # Calls /api/block-builder/generate for preview
    │       ├── sidebar/
    │       │   └── FieldPalette.tsx     # Draggable field type palette (left sidebar)
    │       └── config/
    │           ├── BlockConfig.tsx      # Block-level config (slug, labels)
    │           └── FieldConfig.tsx      # Field-level config (name, type, options)
    │
    ├── builder/
    │   ├── types.ts                     # Internal builder types (SaveSchemaRequest, RawFieldInput)
    │   ├── normalizer.ts                # normaliseSchema()
    │   ├── saveSchema.ts                # saveSchemaLocally() & HTTP
    │   ├── buildFormLayout.ts           # buildFormLayout(), hasUIMetadata(), widthToStyle()
    │   └── index.ts
    │
    ├── renderer/
    │   ├── registry.ts                  # BlockRegistry singleton
    │   ├── DynamicRenderer.tsx          # DynamicRenderer + NestedBlocksRenderer
    │   ├── FieldRenderer.tsx            # Field-by-field rendering
    │   ├── FallbackRenderer.tsx         # Fallback for missing blocks
    │   ├── types.ts
    │   └── index.ts
    │
    ├── components/
    │   ├── admin/
    │   │   ├── TranslationStatus.tsx    # Sidebar translation coverage list
    │   │   └── DuplicateForLocale.tsx   # Translate to… modal
    │   ├── LivePreviewListener.tsx      # 'use client' wrapper for RefreshRouteOnSave
    │   ├── EditInBuilderButton/
    │   │   └── index.tsx                # Payload admin ui field — link to /block-builder?load=<slug>
    │   ├── layout/
    │   │   ├── Header.tsx               # SiteHeader — 'use client', desktop dropdown + mobile accordion
    │   │   └── Footer.tsx               # SiteFooter — server component, social icons
    │   ├── SchemaBuilderField/
    │   │   ├── index.tsx
    │   │   ├── FieldRow.tsx
    │   │   ├── OptionsEditor.tsx
    │   │   └── NestedFieldsEditor.tsx
    │   └── BlockDataField/
    │       ├── index.tsx
    │       ├── SchemaForm.tsx
    │       ├── FieldInput.tsx
    │       ├── ArrayFieldInput.tsx
    │       ├── GroupFieldInput.tsx
    │       ├── MediaPickerInput.tsx
    │       ├── BlocksFieldInput.tsx
    │       └── InsertBlockModal.tsx     # Modal for picking a block type
    │
    ├── scripts/
    │   └── seed.ts                      # Creates block definitions + home page
    │
    └── blocks/
        ├── types.ts                     # Shared BlockPreset interface
        ├── registry-setup.ts            # Central block registration (8 blocks)
        ├── RenderContentBlocks.tsx      # Renders Payload-native contentBlocks array
        ├── Generic/Testimonials/config.ts
        ├── HeroBanner/
        │   ├── index.tsx                # Two-column hero; 5 variants; DashboardMockup
        │   └── presets.ts               # heroBannerPresets[]
        ├── RichText/
        │   └── index.tsx                # Prose block with prose + alignment
        ├── CardGrid/
        │   └── index.tsx                # Feature card grid, 6-color accents, subheading
        ├── Features/
        │   ├── index.tsx                # Icon feature grid; 5 variants; 16 named SVG icons
        │   └── presets.ts               # featuresPresets[]
        ├── CTA/
        │   ├── index.tsx                # CTA section; 6 variants; centered/split layouts
        │   └── presets.ts               # ctaPresets[]
        ├── Testimonials/
        │   ├── index.tsx                # Testimonial grid; default/featured/dark variants
        │   └── presets.ts               # testimonialsPresets[]
        ├── FAQ/
        │   ├── index.tsx                # Accordion FAQ; 'use client'; single/two-column
        │   └── presets.ts               # faqPresets[]
        └── Pricing/
            ├── index.tsx                # Pricing cards; highlighted plan; 4 variants
            └── presets.ts               # pricingPresets[]
```

---

## Key Architectural Patterns

### 1. Write-Once Versioning
Block schemas are immutable version documents. Schema updates create a new version; pages pin to a specific version and never auto-upgrade. Old content renders unchanged even if the schema evolves or the block is deprecated.

### 2. Registry Pattern
`BlockRegistry` singleton maps block slugs to React components at runtime. No build-time code generation. If a component is missing, `FallbackRenderer` renders the data field-by-field — the page never crashes.

### 3. Validation Split
- **Schema validation** (strict): structure, types, constraints, conditions, validation rules, UI metadata
- **Data validation** (against schema): instance values at save/preview time, with `mergeValidation()` merging direct field props with `validation.*`
- **Normalization** (lenient): pre-processes raw input before strict validation

### 4. Depth-Based Relationship Fetching
Pages fetched with `depth: 3` populate `blockDefinition` + `blockVersion` in a single query — no N+1 queries at render time.

### 5. Custom Field Components (Admin UI)
Payload 3.x allows replacing any field's admin UI with a React component via `admin.components.Field`. Custom components use `useField` to read/write values and `useFormFields` to watch sibling fields. Components are registered in `importMap.js` (auto-generated) and referenced by string path in the collection config.

### 6. Transaction-Safe Hooks
`afterChange` hooks pass `req` to all `payload.update()` calls so they share the same DB transaction. This prevents FK violations when the version INSERT and definition UPDATE must be atomic.

### 7. Conditional Field Visibility
Fields with `conditions` are evaluated live in `SchemaForm` before rendering. Conditions read sibling field values via dot-notation paths. Hidden fields are not rendered but their saved values are preserved — only keys absent from the schema are cleaned. This separates display logic from persistence.

### 8. Progressive UI Enhancement
`SchemaForm` checks `hasUIMetadata(schema)` before rendering. Schemas without any layout-affecting `ui` metadata continue rendering in the original flat column layout with zero behavior change. Only schemas that deliberately set `ui.tab`, `ui.section`, `ui.width`, or `ui.order` activate the tabbed grid layout.

### 9. Live Preview via Next.js Draft Mode
The admin Live Preview embeds the frontend in an iframe. `livePreview.url` points to `/api/draft?slug=<slug>`, which authenticates the user, sets the Next.js Draft Mode bypass cookie, and redirects to the real page. The page detects `draftMode().isEnabled` and skips the `status: 'published'` filter so unpublished content is visible. `LivePreviewListener` (a `'use client'` component rendered only in draft mode) calls `router.refresh()` on every Payload `postMessage` save event, triggering a server re-render. Public visitors never load `LivePreviewListener` and always see only published content.

### 10. Nested/Composable Blocks
The `'blocks'` field type enables block composition. `BlocksFieldInput` fetches nested block schemas at runtime using Payload REST batch queries. `NestedBlocksRenderer` on the frontend renders nested blocks via the same registry as top-level blocks, with a configurable depth cap (default 3) to prevent infinite recursion.

### 11. Server-Side Global Fetch for Layout Shell
The frontend layout is an `async` server component that fetches both globals in a single `Promise.all` before rendering. Because Next.js deduplicates `fetch` calls within a render pass and Payload caches at the DB level, this adds negligible overhead. The layout falls back to empty objects so header/footer always render (empty) even if the DB is unreachable during cold-start.

### 13. Variant-Driven Styling
Each prebuilt block defines an internal `V` constant mapping variant names to Tailwind class sets:

```ts
const V = {
  default:  { outer: 'bg-white',       heading: 'text-gray-900', ... },
  dark:     { outer: 'bg-gray-950',    heading: 'text-white',    ... },
  gradient: { outer: 'bg-gradient-to-br from-indigo-50 to-violet-50', ... },
} satisfies Record<FeaturesVariant, Record<string, string>>

const v = V[variant] ?? V.default
```

The `satisfies` constraint catches missing keys at compile time without widening the type. All style decisions live in one place — the rendering JSX just references `v.outer`, `v.heading`, etc. with no conditionals scattered through markup.

### 14. Preset System
**File:** `src/blocks/types.ts`

```ts
export interface BlockPreset {
  id: string
  name: string
  description?: string
  data: Record<string, unknown>
}
```

Each block exports a `*Presets: BlockPreset[]` array from its `presets.ts` file with 3–5 realistic presets covering different variants. Presets serve two purposes:
1. **Seed data** — `seed.ts` imports `[preset][0].data` for the demo home page
2. **Admin quick-start** — presets can be surfaced in the page builder UI to let editors pick a starting point

Preset data is plain JSON that matches the block's schema exactly, so it passes `validateBlockData()` without modification.

### 15. Integrated Visual Block Builder
The block builder runs inside the same Next.js app at `/block-builder` — no separate process, no cross-origin fetch. The builder page is isolated via its own `layout.tsx` (a standalone `<html>/<body>` tree, not nested in the frontend or admin layouts). CSS is scoped to `builder.css`. The builder's `BuilderShell` client component manages all interactivity; server components only read `searchParams` and pass `loadSlug` down as a prop.

**Server/client split for code generation:** ts-morph (Node.js-only) lives in `codegen.ts` which is never imported by client components. `TopBar` and `CodePreview` call `POST /api/block-builder/generate` instead, keeping ts-morph server-side while letting the UI stay a client component.

**Round-trip versioning:** `schemaToBuilderBlock()` and `mapToSaveRequest()` form a symmetric pair for the load/publish cycle. Neither modifies the versioning logic in `saveSchemaLocally()` — the invariant that every publish creates a new immutable version was already correct.

### 12. Client/Server Component Boundary for Interactive Navigation
`SiteHeader` is `'use client'` for dropdown/accordion state. `SiteFooter` and the layout wrapper are server components. The layout passes pre-fetched global data as props — the client component never fetches its own data. An invisible `fixed inset-0` backdrop div closes open dropdowns on outside click without a `useEffect` global event listener, keeping the interaction model simple and memory-leak-free.

### 16. Locale-Linked Pages (Translation Groups)
Each locale variant of a page is a separate `pages` document. `translationGroupId` (UUID) links variants without Payload's built-in localization plugin. Slugs are unique per `(slug, locale_id)` — the homepage uses `/` in every locale. Duplication copies structure (`dbLayout`, `contentBlocks`, `seo`) into a new draft; editors translate text in place. Relationship IDs must be coerced for PostgreSQL on create (see `coerceRelationshipId`).

---

## Data Flow

### Creating a Block Definition

```
POST /api/blocks/save
  → normaliseSchema()
  → validateBlockSchema()
  → find/create BlockDefinition (by slug)
  → create BlockDefinitionVersion (v1)
  → afterChange: update BlockDefinition.currentVersion → v1
```

### Creating a Page Translation

```
Editor: Translate to… → Urdu
  → DuplicateForLocale POST /api/admin/duplicate-page-locale
  → duplicatePageForLocale()
      → coerceRelationshipId(pageId, targetLocaleId)
      → validate: group id, not same locale, target enabled, no duplicate in group
      → resolve slug (keep / for home; suffix -ur for other conflicts)
      → payload.create({ locale: targetLocale.id, status: 'draft', ... })
  → redirect to /admin/collections/pages/<newId>
```

### Rendering a Page

```
GET /ur/about-us  (or /about-us for default locale)
  → middleware: locale segment resolved
  → [locale]/layout.tsx: validateLocale, header-locales + footer-locales + theme
  → getPage("about-us", "ur") with depth: 3
  → generateMetadata() from page.seo
  → <SiteHeader logo=... navigationItems=... ctaButton=... stickyHeader=... />
  → <RenderHero hero={page.hero} />
      → selects HighImpact / MediumImpact / LowImpact by hero.type
  → <DynamicRenderer layout={page.dbLayout} />
      → registry.get(blockDefinition.slug)
      → <HeroBannerBlock /> / <RichTextBlock /> / <CardGridBlock />
         <FeaturesBlock /> / <CTABlock /> / <TestimonialsBlock />
         <FAQBlock /> / <PricingBlock />
         or <FallbackRenderer /> if unregistered
      → if block contains a 'blocks' field:
         → <NestedBlocksRenderer blocks={data.children} />
  → <RenderContentBlocks blocks={page.contentBlocks} />
      → switch on block.blockType → <TestimonialsBlockView />
  → <SiteFooter columns=... socialLinks=... copyright=... />
```

### Schema Evolution (Backward-Compatible)

```
POST /api/blocks/save (updated schema)
  → creates BlockDefinitionVersion v2
  → BlockDefinition.currentVersion → v2

New pages → use v2 automatically
Old pages → still pinned to v1, render with original schema, no migration needed
```

### Re-Versioning via Visual Builder

```
Admin: /admin/collections/block-definitions → open block
  → editInBuilderButton ui field renders EditInBuilderButton
  → click "Edit in Block Builder"
  → /block-builder?load=<slug> opens in new tab

BuilderShell mounts with loadSlug prop
  → GET /api/block-builder/load/<slug>
      → payload.auth() — accepts session cookie (same origin)
      → payload.find({ collection: 'block-definitions', where: { slug } })
      → resolves currentVersion at depth: 2
      → schemaToBuilderBlock() converts DB fields → BlockDefinition
      → returns { block }
  → loadBlock(block) — replaces Zustand store with loaded block

User edits visually (drag fields, modify properties)

Clicks "Publish to Payload"
  → mapToSaveRequest(block) → SaveSchemaRequest
  → POST /api/blocks/save (session cookie auth)
      → saveSchemaLocally() detects existing slug
      → creates new BlockDefinitionVersion (v2, v3, ...)
      → updates BlockDefinition.currentVersion

New pages use new version; existing pages keep their pinned version untouched
```

### Live Preview

```
Editor clicks "Live Preview" in admin
  → livePreview.url builds: /api/draft?slug=about-us&locale=en
  → iframe loads /api/draft?slug=about-us&locale=en
      → payload.auth() — 401 if not logged in
      → draftMode().enable() — sets __prerender_bypass cookie
      → redirect(/about-us)
  → page.tsx runs with isDraftMode = true
      → getPage(slug, isDraft=true) — no status filter, returns any status
      → renders <LivePreviewListener serverURL="..." />
  → editor edits a field → Payload auto-saves
      → window.postMessage fired into iframe
      → LivePreviewListener calls router.refresh()
      → server re-renders page.tsx → updated content shown in iframe
```

### Admin Data Entry with Conditions

```
Editor opens page block instance
  → BlockDataField fetches schema for pinned blockVersion
  → SchemaForm checks hasUIMetadata(schema)
      → flat layout (no ui metadata) or tabbed grid layout
  → per field: evaluateConditions(field.conditions, mode, currentData)
      → false → field not rendered (value preserved in data)
      → true  → FieldInput rendered
  → onChange → setValue → Payload field value updated
```

---

## Environment Variables

```env
DATABASE_URI=postgresql://user:pass@localhost:5432/payload_dynamic_blocks
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_SECRET=your-secret-here
```

## Scripts

```bash
pnpm dev                 # Start Next dev server
pnpm build               # Production build
pnpm start               # Start production server
pnpm dev:prod            # Clean build and run production server locally
pnpm lint                # Next lint
pnpm lint:fix            # Next lint with fixes
pnpm payload             # Run Payload CLI
pnpm generate:importmap  # Regenerate Payload admin import map
pnpm generate:types      # Regenerate payload-types.ts
pnpm seed                # Seed block definitions + create home page (slug: /)
pnpm migrate:create      # Create DB migration
pnpm migrate:run         # Apply migrations
pnpm migrate:status      # Check migration status
```
