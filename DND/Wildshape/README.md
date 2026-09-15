# Wild Shape Compass

A small, framework-free GitHub Pages app for browsing D&D 2024 Wild Shape forms. It runs entirely in the browser and needs no backend.

## Run locally

Because JavaScript modules do not reliably run over `file://`, open the project directory with any local web server, for example your editor's preview extension. Then open `index.html` in the browser.

## Structure

```
index.html              Entry point
styles/main.css         Styling
src/config.js           Mock/API switch and API URL
src/models/beast.js     App-owned model and API normalization
src/data/               Mock data and data access
src/domain/wildshape.js Wild Shape rules helper
src/ui/                 Render functions for the list and detail view
src/main.js             App state, filters, and UI composition
```

## Data source

By default, the app loads all 91 SRD 2024 Beasts from Open5e. The API returns 50 results per page; `src/data/beast-repository.js` automatically follows the `next` link and combines both pages.

To use the fictional development data in `src/data/mock-beasts.js`, set `USE_MOCK_DATA` to `true` in `src/config.js`.

The sample data in `src/data/mock-beasts.js` is fictional and intended only for development. It contains no published D&D monster data.

## GitHub Pages

1. Upload this project to a GitHub repository.
2. In the repository settings, enable deployment from a branch under **Pages** (for example `main`, folder `/ (root)`).
3. After a short time, the app will be available at the URL shown there.

All file paths are relative, so the app also works from a GitHub Pages repository subpath.

## Rules note

`src/domain/wildshape.js` contains a deliberately small rules helper for levels, CR, and flying movement. Verify it against the rules source used at your table before play, and adapt it centrally there if needed.
