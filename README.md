# Vermont Terrain

![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![MapLibre GL JS](https://img.shields.io/badge/MapLibre_GL_JS-6-396cb2?logo=maplibre&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An interactive terrain map of Vermont, built with [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) and Svelte 5.

## Features

- Hillshade relief with adjustable sun angle and shadow intensity
- 3D terrain view
- Elevation highlighting above and/or below a chosen threshold
- Hypsometric (elevation-banded) color tinting
- Switch terrain source between bare-earth DEM, a surface model (DSM) that includes buildings and tree canopy, and Mapterhorn's global 1m DEM (2013–2017)
- VCGI aerial imagery overlay
- Click-to-draw elevation profile between two points, charted by distance

## Development

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Deployment

`npm run build` produces a static site in `dist/` — upload it as-is to any static host (e.g. Azure Blob static website hosting). No server or rewrite rules needed. See [CLAUDE.md](CLAUDE.md) for the build-time gotchas this depends on (relative asset paths, maplibre-gl's worker script).

## Data sources

- VCGI bare-earth DEM and DSM terrain tiles (sourced from USGS elevation data) are pmtiles served from S3, encoded as terrarium raster-dem
- [Mapterhorn](https://mapterhorn.com/attribution)'s global 1m DEM (2013–2017), loaded from its TileJSON endpoint
- Imagery overlay is VCGI's `IMG_VCGI_CLR_WM_CACHE` ArcGIS tile service

See [CLAUDE.md](CLAUDE.md) for architecture notes.

## Credits

- [VCGI](https://vcgi.vermont.gov/) — Vermont terrain and imagery data
- [USGS](https://www.usgs.gov/) — elevation data
- [Mapterhorn](https://mapterhorn.com/attribution) — global 1m DEM
- [MapLibre GL JS](https://maplibre.org/) — map rendering

## License

MIT — see [LICENSE](LICENSE).
