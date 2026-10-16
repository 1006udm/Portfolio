# Unnati Maharjan — Portfolio

Personal portfolio site, deployed to GitHub Pages from the `main` branch
(see `.github/workflows/static.yml`).

## Folder structure

```
index.html              The site (single page)
css/style.css           All styles — mobile-first, breakpoints use min-width
js/script.js            Slide-in titles, Guliyo gallery toggle + carousel

assets/images/          Web-optimized images the site actually loads (WebP)
  site/                 Logo, hero illustration, About image
  projects/             One cover image per project card
  guliyo-gallery/       Images in the "View all designs" carousel

source-files/           High-res originals — NOT loaded by the site
  site/                 Originals of the site images
  projects/             Originals of the project covers
  guliyo/               Guliyo artwork & mockups (incl. unused tea + packaging)
  other-work/           Work not on the site yet (Dashain, posters, Vans, …)
```

## Naming

- lowercase, words separated by hyphens, no spaces: `jaad-mockup.jpg`
- web images end with their width (or height, for gallery images):
  `marginalia-480.webp`, `marginalia-960.webp`

## Adding a new image

1. Put the original in the matching `source-files/` folder.
2. Export two WebP versions into `assets/images/…` — a small one (~480px)
   and a large one (~960px) — at about 80% quality.
3. Reference both in `index.html` with `srcset`, and include `width`,
   `height`, `alt` and `loading="lazy"` (except for the hero image).

## Browser & device support

Works on phones, tablets, laptops and large desktop monitors in current
Chrome, Edge, Firefox and Safari (desktop and iOS/Android).

- Layout is mobile-first; two-column layouts start at tablet width, and the
  whole page scales up slightly on monitors 1600px and wider.
- Newer CSS features (container-query font sizing, `color-mix`, `text-wrap`)
  each have a fallback, so older browsers still get a working layout.
- Desktop extras: hover states, click-and-drag + arrow buttons + arrow keys
  in the Guliyo gallery, current-section highlight in the nav, full keyboard
  navigation with visible focus outlines.
