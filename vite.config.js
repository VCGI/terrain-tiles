import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// maplibre-gl computes its worker script's URL at runtime relative to its
// own bundled chunk (`import.meta.url`) via a dynamic string, which Rollup
// can't statically detect — so the worker file never makes it into dist/ on
// its own. Without it, hillshade/terrain silently fail to render (flat
// background, no console error) once deployed, even though `npm run dev`
// works fine (there maplibre-gl is served unbundled straight from
// node_modules — see optimizeDeps.exclude below). Copy it in manually,
// alongside the built entry chunk (both land in the default `assets/` dir).
// The worker module itself imports from a sibling `maplibre-gl-shared.mjs`,
// which needs the same treatment or the worker fails to load silently.
const MAPLIBRE_WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

function copyMaplibreWorker() {
  return {
    name: 'copy-maplibre-worker',
    writeBundle(options) {
      for (const file of MAPLIBRE_WORKER_FILES) {
        copyFileSync(
          fileURLToPath(new URL(`./node_modules/maplibre-gl/dist/${file}`, import.meta.url)),
          `${options.dir}/assets/${file}`,
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), copyMaplibreWorker()],
  base: './',
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
