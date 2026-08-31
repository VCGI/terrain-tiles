<script>
    import { onMount } from 'svelte';
    import * as maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import { Protocol } from 'pmtiles';
    import { buildStyle } from './mapStyle.js';

    let { map = $bindable(null) } = $props();
    let container;

    onMount(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        const instance = new maplibregl.Map({
            container,
            hash: 'map',
            zoom: 8.5,
            center: [-72.7, 44.05],
            pitch: 0,
            maxPitch: 70,
            style: buildStyle(),
            attributionControl: {
                compact: true,
                customAttribution: [
                    "<a href='https://mapterhorn.com/' target='_blank'>Mapterhorn</a>",
                    "<a href='https://maplibre.org/' target='_blank'>MapLibre</a>",
                ],
            },
        });

        instance.addControl(
            new maplibregl.NavigationControl({ showZoom: false, showCompass: true, visualizePitch: false }),
            'top-left',
        );

        // MapLibre's `compact` attribution option only auto-collapses below
        // 640px and otherwise starts expanded — there's no public option to
        // start collapsed, so force it into the same "icon only" state its
        // own click handler toggles into.
        const attrib = instance.getContainer().querySelector('.maplibregl-ctrl-attrib');
        attrib?.classList.remove('maplibregl-compact-show');
        attrib?.removeAttribute('open');

        map = instance;

        return () => {
            map = null;
            instance.remove();
            maplibregl.removeProtocol('pmtiles');
        };
    });
</script>

<div id="map" bind:this={container}></div>

<style>
    #map {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
        background: #e8e6df;
    }
</style>
