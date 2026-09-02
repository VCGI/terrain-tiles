import { VT_BOUNDARY_RING } from './vtBoundary.js';

// Placeholder only — real colors are set via tintExpression() as soon as a
// tint layer becomes visible (see ControlsPanel.svelte), so the stops here
// never actually render.
const TRANSPARENT_TINT = [
    'interpolate',
    ['linear'],
    ['elevation'],
    0, 'rgba(0, 0, 0, 0)',
    1, 'rgba(0, 0, 0, 0)',
];

// A classic hypsometric (elevation-banded) color ramp — dark green in the
// valleys through yellow/orange to a pale tone near Vermont's highest
// summits (~1340m / Mt. Mansfield). Semi-transparent so hillshade relief
// shading still shows through underneath.
const HYPSOMETRIC_RAMP = [
    'interpolate',
    ['linear'],
    ['elevation'],
    0, 'rgba(46, 92, 63, 0.55)',
    150, 'rgba(90, 138, 74, 0.55)',
    300, 'rgba(154, 173, 88, 0.55)',
    500, 'rgba(214, 197, 102, 0.55)',
    700, 'rgba(214, 157, 92, 0.55)',
    900, 'rgba(191, 122, 82, 0.55)',
    1100, 'rgba(163, 107, 89, 0.55)',
    1300, 'rgba(214, 204, 194, 0.55)',
];

// Every terrain source the map can shade/tint from. 'dem' is the default and
// keeps the original (unsuffixed) layer ids; the rest get `-${key}` layer id
// variants (see layerIdFor). Add a new terrain source by adding one entry
// here and one entry under `sources` in buildStyle().
export const TERRAIN_SOURCES = [
    { key: 'dem', label: 'Bare Earth 0.35m (2023)', sourceId: 'hillshadeSource' },
    { key: 'dsm', label: 'Surface Model (2023)', sourceId: 'hillshadeSourceDsm' },
    { key: 'mapterhorn', label: 'Bare Earth 1m (2013–2017)', sourceId: 'hillshadeSourceMapterhorn' },
];

export function sourceIdFor(terrainSource) {
    return TERRAIN_SOURCES.find((source) => source.key === terrainSource).sourceId;
}

export function layerIdFor(baseId, terrainSource) {
    return terrainSource === 'dem' ? baseId : `${baseId}-${terrainSource}`;
}

export function tintExpression(thresholdMeters, colorBelow, colorAbove) {
    return [
        'interpolate',
        ['linear'],
        ['elevation'],
        thresholdMeters - 1, colorBelow,
        thresholdMeters, colorAbove,
    ];
}

function buildHillshadeLayer(terrainSource) {
    return {
        id: layerIdFor('hillshade', terrainSource),
        type: 'hillshade',
        source: sourceIdFor(terrainSource),
        ...(terrainSource !== 'dem' && { layout: { visibility: 'none' } }),
        paint: {
            'hillshade-illumination-direction': 315,
        },
    };
}

function buildHypsometricLayer(terrainSource) {
    return {
        id: layerIdFor('hypsometric-tint', terrainSource),
        type: 'color-relief',
        source: sourceIdFor(terrainSource),
        layout: {
            visibility: 'none',
        },
        paint: {
            'color-relief-color': HYPSOMETRIC_RAMP,
        },
    };
}

function buildTintLayer(baseId, terrainSource) {
    return {
        id: layerIdFor(baseId, terrainSource),
        type: 'color-relief',
        source: sourceIdFor(terrainSource),
        layout: {
            visibility: 'none',
        },
        paint: {
            'color-relief-color': TRANSPARENT_TINT,
        },
    };
}

export function buildStyle() {
    const terrainKeys = TERRAIN_SOURCES.map((source) => source.key);

    return {
        version: 8,
        sources: {
            imagerySource: {
                type: 'raster',
                tiles: [
                    'https://maps.vcgi.vermont.gov/arcgis/rest/services/EGC_services/IMG_VCGI_CLR_WM_CACHE/ImageServer/tile/{z}/{y}/{x}',
                ],
                tileSize: 256,
                minzoom: 0,
                maxzoom: 23,
                bounds: [-73.47075548691062, 42.71150944042681, -71.43789719419486, 45.032768390204836],
                attribution: 'VCGI',
            },
            hillshadeSource: {
                type: 'raster-dem',
                url: 'pmtiles://https://s3.us-east-2.amazonaws.com/vtopendata-prd/Elevation/STATEWIDE_2023_35cm_DEMHF_TERRARIUM.pmtiles',
                encoding: 'terrarium',
                tileSize: 512,
                attribution: 'VCGI | USGS',
            },
            hillshadeSourceDsm: {
                type: 'raster-dem',
                url: 'pmtiles://https://s3.us-east-2.amazonaws.com/vtopendata-dev/terrain-tiles/vermont-dsm.pmtiles',
                encoding: 'terrarium',
                tileSize: 512,
                attribution: 'VCGI | USGS',
            },
            hillshadeSourceMapterhorn: {
                type: 'raster-dem',
                url: 'https://tiles.mapterhorn.com/tilejson.json',
                encoding: 'terrarium',
                tileSize: 512,
                attribution: 'USGS',
            },
            vtMask: {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]],
                            VT_BOUNDARY_RING,
                        ],
                    },
                },
            },
            profileLine: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            },
        },
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#e8e6df',
                },
            },
            {
                id: 'imagery',
                type: 'raster',
                source: 'imagerySource',
                layout: {
                    visibility: 'none',
                },
            },
            ...terrainKeys.map(buildHillshadeLayer),
            ...terrainKeys.map(buildHypsometricLayer),
            ...['elevation-tint-above', 'elevation-tint-below'].flatMap((baseId) =>
                terrainKeys.map((terrainSource) => buildTintLayer(baseId, terrainSource)),
            ),
            {
                id: 'vt-mask',
                type: 'fill',
                source: 'vtMask',
                paint: {
                    'fill-color': '#e8e6df',
                },
            },
            {
                id: 'profile-line',
                type: 'line',
                source: 'profileLine',
                paint: {
                    'line-color': '#000000',
                    'line-width': 1.5,
                    'line-dasharray': [2, 2],
                },
            },
        ],
    };
}
