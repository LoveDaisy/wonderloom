# Light-led redesign verification

## Baseline

- Commit: `8365dbcbcdeb1522ffa0656132a16285ee966da1`
- Production preview: local Astro build at `http://127.0.0.1:4323/` (the port is only a local capture endpoint).
- Viewports: 1440×900, 768×1024, 390×844.
- Commands: `npm run test:content`; `npx astro check`; `npx astro build`; `npm run test:site`; `git diff --check`.
- Result: content tests 8/8; Astro 0 errors, 0 warnings, 0 hints; build produced 46 pages; site check covered 1,486 local links/assets, 11 author articles and 66 author assets.

The captured homepage folds and machine-readable inspector/resource outputs are in `baseline/`. The resource capture uses a fresh, cache-disabled browser at 1440×900: 55,909 B transferred before below-fold lazy images, with no duplicate resource URL. It is a local-preview comparison baseline, not a public-network performance claim.

### Historical-direction isolation

`ResearchLayout` now imports only `directions-legacy.css`, which in turn imports frozen copies of the old token and notebook styles plus the directions-only presentation stylesheet. `BaseLayout` imports the separate `site.css` formal-site entry. The copied legacy token values are intentionally retained byte-for-byte at isolation time. A rebuilt browser capture of `/directions/research/notebook/home/` records `--paper: #f6f2e4`, `--ink: #303d50` and `--nb-page-size: 48px`; its generated HTML loads a single `ResearchLayout` stylesheet and no formal-site entry. See `baseline/directions-notebook-*after-isolation.*`.

### Baseline route and semantic invariants

| Area | Current evidence that must survive the redesign |
| --- | --- |
| Static output | 46 routes: 31 writing/article routes, 5 explore routes, 3 project routes, home, about, 404, and 14 noindex direction/reference routes. |
| Article states | `color-space-basics` is guide-only; `halo-2` is author-text-only; `halo-introduction` and `halo-direct-integration` combine a site guide with author text. |
| Author text | 11 ice-halo author articles and 66 imported assets. The generated author body is read-only; images, equations, tables, headings and footnotes remain in their original order. |
| Content network | 3 topics, 2 ordered reading paths and 13 explicitly described relations. Topic membership must not synthesize relations. |
| Browser/SEO | Main pages retain one `h1`, canonical and OG metadata; directions retain `noindex`; the 404 route remains a real generated 404. |

### What the baseline deliberately changes

The baseline inspector reports the old homepage’s readable problems: three eyebrow labels, seven thin decorative rules, no first-screen focal element, only three raster images, no motion, and two sparse desktop screens. These are diagnostic observations, not a proxy for the author's final aesthetic judgement.

## Chosen direction

The project uses the `type-only-statement` composition drawn by `design-taste-frontend` (seed `2031677577`): a plain-language personal-site statement is the first screen; images enter afterward as evidence. The subject-specific idea is:

> A real beam of light travelling through ice crystals, a simulator, spectral rendering and camera colour becomes the page’s reading device.

The live implementation is a static-first four-stop light path: every stop, source and destination is ordinary HTML, so it remains readable and navigable without JavaScript. The only enhanced relationship explorer remains on the explore page, where native `details` is the no-JavaScript fallback.

Two redraws were necessary and are recorded here rather than silently blending the direction:

1. The dealt dark “Night and cornflower” palette contradicts the task’s explicit no-dark rule. It was redrawn to a light, low-chroma ground with a single deep green/blue action colour; final token values remain code-owned.
2. The initial Anton display face has no Chinese glyph coverage. The type slot was redrawn; implementation will use a Chinese-capable system stack (with an optional display variable face only where its actual glyph coverage is verified), never a Latin-only face as a faux Chinese display treatment.

The direction sheet and its temporary artefacts remain in ignored `.taste-skill/`; the durable decision and constraints are recorded here.

## Implemented formal direction

The formal site now has a separate light-led style entry: `BaseLayout` uses `site.css`, while `ResearchLayout` continues to load only frozen legacy direction styles. The first screen is a text-led statement; four original scientific images appear later as evidence in the reading line. The formal system uses a Chinese-capable Songti/system-sans stack, a light low-chroma paper ground, ordinary document-flow navigation, square media, and no automatic animation.

`scripts/check-site.mjs` now protects the homepage’s four light-path stops, its distinct camera-colour and white-balance branches, and the absence of the historical “2 亿光线 / 220秒” benchmark from generic homepage claims. The broader content, routing, article-state, series-order and explicit-network assertions remain in the same check.

## Final local verification

- Screenshots: `final/home-1440x900.jpg`, `final/home-768x1024.jpg`, `final/home-390x844.jpg`.
- Inspector: `final/home-inspect.json` records four complete raster scientific images, no broken image, no horizontal overflow at 1440/768/390, and zero automatic motion.
- Commands: `npm run test:content`, `npx astro check`, `npx astro build`, `npm run test:site`, `git diff --check`.
- Result: content tests 8/8; Astro has 0 errors, 0 warnings and 0 hints; the build produces 46 pages; the static-site check validates 1,454 local links/assets plus source, routing and article-state invariants.
