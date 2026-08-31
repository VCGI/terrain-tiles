<script>
    import { onMount } from 'svelte';
    import * as maplibregl from 'maplibre-gl';
    import { haversineMiles, METERS_PER_FOOT } from './geo.js';
    import { sourceIdFor } from './mapStyle.js';

    let { map, is3d, terrainSource, armed = $bindable(false) } = $props();

    let profilePoints = $state([]);
    let profileMarkers = [];
    let profileOpen = $state(false);
    let samples = $state(null);

    function clearProfile() {
        profilePoints = [];
        profileMarkers.forEach((marker) => marker.remove());
        profileMarkers = [];
        map.getSource('profileLine').setData({ type: 'FeatureCollection', features: [] });
        profileOpen = false;
        samples = null;
    }

    // map.queryTerrainElevation() only returns real values once terrain is
    // active, so if 3D isn't already on we enable it just long enough to
    // sample, then turn it back off — leaving terrain on permanently would
    // blur the 2D hillshade (see the shadow-intensity/terrain-source controls).
    async function sampleProfile(a, b) {
        const wasIs3d = is3d;
        const SAMPLE_COUNT = 100;
        const totalMiles = haversineMiles(a, b);
        const points = Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => {
            const t = i / SAMPLE_COUNT;
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        });

        if (!wasIs3d) {
            map.setTerrain({ source: sourceIdFor(terrainSource), exaggeration: 1 });
            await waitForSourceLoaded(sourceIdFor(terrainSource));
        }

        samples = points.map((point, i) => {
            const elevationMeters = map.queryTerrainElevation(point);
            return {
                distanceMiles: totalMiles * (i / SAMPLE_COUNT),
                elevationFeet: elevationMeters === null ? null : elevationMeters / METERS_PER_FOOT,
            };
        });

        if (!wasIs3d) {
            map.setTerrain(null);
        }

        profileOpen = true;
    }

    // 'idle' waits for every active source in the style (imagery overlay,
    // hillshade, etc.) to finish loading, which is far more than the profile
    // tool needs — and gets slower the more of the map a long-distance
    // profile spans. Wait only for the terrain source's own tiles instead.
    // (queryTerrainElevation isn't a usable readiness signal here: MapLibre
    // returns a placeholder elevation — not null — for tiles still loading.)
    function waitForSourceLoaded(sourceId) {
        if (map.isSourceLoaded(sourceId)) return Promise.resolve();
        return new Promise((resolve) => {
            function check(e) {
                if (e.sourceId !== sourceId || !map.isSourceLoaded(sourceId)) return;
                map.off('sourcedata', check);
                resolve();
            }
            map.on('sourcedata', check);
        });
    }

    function computeChart(samples) {
        if (!samples) return null;

        const width = 428;
        const height = 140;
        const padding = { top: 10, right: 10, bottom: 20, left: 44 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        const elevations = samples.map((s) => s.elevationFeet).filter((e) => e !== null);
        const minEl = Math.min(...elevations);
        const maxEl = Math.max(...elevations);
        const elRange = Math.max(maxEl - minEl, 1);
        const totalMiles = samples[samples.length - 1].distanceMiles;

        const xFor = (distanceMiles) => padding.left + (distanceMiles / totalMiles) * plotWidth;
        const yFor = (elevationFeet) => padding.top + plotHeight - ((elevationFeet - minEl) / elRange) * plotHeight;

        const linePoints = samples
            .filter((s) => s.elevationFeet !== null)
            .map((s) => `${xFor(s.distanceMiles).toFixed(1)},${yFor(s.elevationFeet).toFixed(1)}`);

        const baseline = padding.top + plotHeight;
        const areaPoints = [
            `${xFor(0).toFixed(1)},${baseline}`,
            ...linePoints,
            `${xFor(totalMiles).toFixed(1)},${baseline}`,
        ].join(' ');

        return {
            width,
            height,
            padding,
            plotHeight,
            minEl,
            maxEl,
            totalMiles,
            linePoints: linePoints.join(' '),
            areaPoints,
            maxElY: yFor(maxEl),
            minElY: yFor(minEl),
        };
    }

    let chart = $derived(computeChart(samples));
    let summaryText = $derived(
        chart
            ? `Elevation profile — ${chart.totalMiles.toFixed(2)} mi, ${Math.round(chart.minEl)}–${Math.round(chart.maxEl)}ft`
            : 'Elevation profile',
    );

    $effect(() => {
        if (armed) {
            clearProfile();
            map.getCanvas().style.cursor = 'crosshair';
        } else {
            map.getCanvas().style.cursor = '';
        }
    });

    onMount(() => {
        function handleClick(e) {
            if (!armed) return;

            const lngLat = [e.lngLat.lng, e.lngLat.lat];
            profilePoints.push(lngLat);
            profileMarkers.push(new maplibregl.Marker({ color: '#000000', scale: 0.6 }).setLngLat(lngLat).addTo(map));

            if (profilePoints.length === 2) {
                armed = false;
                map.getSource('profileLine').setData({
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: { type: 'LineString', coordinates: profilePoints },
                            properties: {},
                        },
                    ],
                });
                sampleProfile(profilePoints[0], profilePoints[1]);
            }
        }

        map.on('click', handleClick);
        return () => map.off('click', handleClick);
    });
</script>

<div id="profile-panel" class:open={profileOpen}>
    <div class="profile-header">
        <span class="profile-title">{summaryText}</span>
        <button id="profile-close" aria-label="Close elevation profile" onclick={clearProfile}>×</button>
    </div>
    <svg id="profile-chart" width="428" height="140" viewBox="0 0 428 140">
        {#if chart}
            <line x1={chart.padding.left} y1={chart.padding.top} x2={chart.padding.left} y2={chart.padding.top + chart.plotHeight} stroke="#ddd" />
            <line x1={chart.padding.left} y1={chart.padding.top + chart.plotHeight} x2={chart.width - chart.padding.right} y2={chart.padding.top + chart.plotHeight} stroke="#ddd" />
            <text x={chart.padding.left - 6} y={chart.maxElY + 4} font-size="10" fill="#777" text-anchor="end">{Math.round(chart.maxEl)}ft</text>
            <text x={chart.padding.left - 6} y={chart.minElY + 4} font-size="10" fill="#777" text-anchor="end">{Math.round(chart.minEl)}ft</text>
            <text x={chart.padding.left} y={chart.height - 4} font-size="10" fill="#777" text-anchor="start">0 mi</text>
            <text x={chart.width - chart.padding.right} y={chart.height - 4} font-size="10" fill="#777" text-anchor="end">{chart.totalMiles.toFixed(2)} mi</text>
            <polygon points={chart.areaPoints} fill="rgba(0, 0, 0, 0.08)" stroke="none" />
            <polyline points={chart.linePoints} fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="4,3" />
        {/if}
    </svg>
</div>

<style>
    #profile-panel {
        display: none;
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
        width: 460px;
        max-width: calc(100% - 20px);
        box-sizing: border-box;
        padding: 14px 16px;
        font-family: inherit;
        font-size: 12px;
        line-height: 1.4;
        color: #222;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
    }

    #profile-panel.open {
        display: block;
    }

    .profile-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
    }

    .profile-title {
        color: #777;
        font-size: 12px;
    }

    #profile-close {
        border: none;
        background: none;
        font-family: inherit;
        font-size: 16px;
        line-height: 1;
        color: #777;
        cursor: pointer;
        padding: 0 2px;
    }

    #profile-close:hover {
        color: #000;
    }
</style>
