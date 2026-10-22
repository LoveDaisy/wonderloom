# Light-led redesign verification

## Baseline

- Commit: `8365dbcbcdeb1522ffa0656132a16285ee966da1`
- Production preview: local Astro build at `http://127.0.0.1:4323/` (the port is only a local capture endpoint).
- Viewports: 1440×900, 768×1024, 390×844.
- Commands: `npm run test:content`; `npx astro check`; `npx astro build`; `npm run test:site`; `git diff --check`.
- Result: content tests 8/8; Astro 0 errors, 0 warnings, 0 hints; build produced 46 pages; site check covered 1,486 local links/assets, 11 author articles and 66 author assets.

The captured homepage folds and machine-readable inspector/resource outputs are in `baseline/`. The resource capture uses a fresh, cache-disabled browser at 1440×900: 55,909 B transferred before below-fold lazy images, with no duplicate resource URL. It is a local-preview comparison baseline, not a public-network performance claim.

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

The live thing is a static-first four-stop light path: focus, keyboard and touch select a stop to update the same-page image/annotation, while every stop and destination stays present as ordinary HTML links without JavaScript.

Two redraws were necessary and are recorded here rather than silently blending the direction:

1. The dealt dark “Night and cornflower” palette contradicts the task’s explicit no-dark rule. It was redrawn to a light, low-chroma ground with a single deep green/blue action colour; final token values remain code-owned.
2. The initial Anton display face has no Chinese glyph coverage. The type slot was redrawn; implementation will use a Chinese-capable system stack (with an optional display variable face only where its actual glyph coverage is verified), never a Latin-only face as a faux Chinese display treatment.

The direction sheet and its temporary artefacts remain in ignored `.taste-skill/`; the durable decision and constraints are recorded here.
