<script>
    import { METERS_PER_FOOT } from './geo.js';
    import { TERRAIN_SOURCES, sourceIdFor, layerIdFor, tintExpression } from './mapStyle.js';

    let {
        map,
        is3d = $bindable(false),
        terrainSource = $bindable('dem'),
        profileArmed = $bindable(false),
    } = $props();

    let open = $state(false);

    let sunAngle = $state(315);
    let shadowIntensity = $state(0.5);
    let tintAboveEnabled = $state(false);
    let tintAboveElevation = $state(2000);
    let tintBelowEnabled = $state(false);
    let tintBelowElevation = $state(1000);
    let hypsometricEnabled = $state(false);
    let imageryEnabled = $state(false);

    function activeHillshadeLayer() {
        return layerIdFor('hillshade', terrainSource);
    }
    function activeTintAboveLayer() {
        return layerIdFor('elevation-tint-above', terrainSource);
    }
    function activeTintBelowLayer() {
        return layerIdFor('elevation-tint-below', terrainSource);
    }
    function activeHypsometricLayer() {
        return layerIdFor('hypsometric-tint', terrainSource);
    }
    function activeSource() {
        return sourceIdFor(terrainSource);
    }

    function updateSunAngle() {
        map.setPaintProperty(activeHillshadeLayer(), 'hillshade-illumination-direction', sunAngle);
    }

    function updateShadowIntensity() {
        map.setPaintProperty(activeHillshadeLayer(), 'hillshade-exaggeration', shadowIntensity);
    }

    function updateTintAboveExpression() {
        if (!Number.isFinite(tintAboveElevation)) return;
        const thresholdMeters = tintAboveElevation * METERS_PER_FOOT;
        map.setPaintProperty(
            activeTintAboveLayer(),
            'color-relief-color',
            tintExpression(thresholdMeters, 'rgba(0, 0, 0, 0)', 'rgba(214, 84, 44, 0.45)'),
        );
    }

    function updateTintBelowExpression() {
        if (!Number.isFinite(tintBelowElevation)) return;
        const thresholdMeters = tintBelowElevation * METERS_PER_FOOT;
        map.setPaintProperty(
            activeTintBelowLayer(),
            'color-relief-color',
            tintExpression(thresholdMeters, 'rgba(24, 64, 160, 0.45)', 'rgba(0, 0, 0, 0)'),
        );
    }

    // The hillshade layer's default highlight/shadow colors are fully opaque
    // white/black, painted over whatever is beneath it. That reads fine over a
    // flat background, but washes out the imagery layer's colors underneath —
    // so use translucent versions while imagery is showing.
    function updateHillshadeStyle() {
        map.setPaintProperty(
            activeHillshadeLayer(),
            'hillshade-highlight-color',
            imageryEnabled ? 'rgba(255, 255, 255, 0.35)' : '#ffffff',
        );
        map.setPaintProperty(
            activeHillshadeLayer(),
            'hillshade-shadow-color',
            imageryEnabled ? 'rgba(0, 0, 0, 0.55)' : '#000000',
        );
    }

    function handleToggle3d() {
        if (is3d) {
            map.setTerrain({ source: activeSource(), exaggeration: 1 });
            map.setSky({});
            map.easeTo({ pitch: 55, duration: 500 });
        } else {
            map.easeTo({ pitch: 0, duration: 500 });
            map.setTerrain(null);
        }
    }

    function handleTintAboveToggle() {
        if (tintAboveEnabled) updateTintAboveExpression();
        map.setLayoutProperty(activeTintAboveLayer(), 'visibility', tintAboveEnabled ? 'visible' : 'none');
    }

    function handleTintBelowToggle() {
        if (tintBelowEnabled) updateTintBelowExpression();
        map.setLayoutProperty(activeTintBelowLayer(), 'visibility', tintBelowEnabled ? 'visible' : 'none');
    }

    function handleHypsometricToggle() {
        map.setLayoutProperty(activeHypsometricLayer(), 'visibility', hypsometricEnabled ? 'visible' : 'none');
    }

    function handleTerrainSourceChange() {
        for (const source of TERRAIN_SOURCES) {
            const isActive = source.key === terrainSource;
            map.setLayoutProperty(layerIdFor('hillshade', source.key), 'visibility', isActive ? 'visible' : 'none');
            map.setLayoutProperty(
                layerIdFor('elevation-tint-above', source.key),
                'visibility',
                isActive && tintAboveEnabled ? 'visible' : 'none',
            );
            map.setLayoutProperty(
                layerIdFor('elevation-tint-below', source.key),
                'visibility',
                isActive && tintBelowEnabled ? 'visible' : 'none',
            );
            map.setLayoutProperty(
                layerIdFor('hypsometric-tint', source.key),
                'visibility',
                isActive && hypsometricEnabled ? 'visible' : 'none',
            );
        }

        updateSunAngle();
        updateShadowIntensity();
        updateTintAboveExpression();
        updateTintBelowExpression();
        updateHillshadeStyle();

        if (is3d) {
            map.setTerrain({ source: activeSource(), exaggeration: 1 });
        }
    }

    function handleImageryToggle() {
        map.setLayoutProperty('imagery', 'visibility', imageryEnabled ? 'visible' : 'none');
        updateHillshadeStyle();
    }
</script>

<button
    id="panel-toggle"
    aria-label="Show map controls"
    onclick={() => (open = !open)}
>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
</button>

<div id="controls" class:open>
    <div class="control">
        <div class="control-label-row">
            <label for="toggle-3d">3D view</label>
            <span class="switch">
                <input type="checkbox" id="toggle-3d" bind:checked={is3d} onchange={handleToggle3d} />
                <span class="track"></span>
            </span>
        </div>
    </div>
    <div class="control">
        <span id="terrain-source-label">Terrain source</span>
        <div class="terrain-sources" role="radiogroup" aria-labelledby="terrain-source-label">
            {#each TERRAIN_SOURCES as source (source.key)}
                <label class="segmented-option">
                    <input
                        type="radio"
                        name="terrain-source"
                        bind:group={terrainSource}
                        value={source.key}
                        onchange={handleTerrainSourceChange}
                    />
                    {source.label}
                </label>
            {/each}
        </div>
    </div>
    <div class="control">
        <label for="sun-angle">Sun angle</label>
        <div class="control-row">
            <input type="range" id="sun-angle" min="0" max="359" bind:value={sunAngle} oninput={updateSunAngle} />
            <span class="value">{sunAngle}°</span>
        </div>
    </div>
    <div class="control">
        <label for="shadow-intensity">Shadow intensity</label>
        <div class="control-row">
            <input
                type="range"
                id="shadow-intensity"
                min="0"
                max="1"
                step="0.05"
                bind:value={shadowIntensity}
                oninput={updateShadowIntensity}
            />
            <span class="value">{Math.round(shadowIntensity * 100)}%</span>
        </div>
    </div>
    <hr class="divider" />
    <div class="control">
        <div class="control-label-row">
            <label for="tint-above-enabled">Highlight above elevation</label>
            <span class="switch">
                <input type="checkbox" id="tint-above-enabled" bind:checked={tintAboveEnabled} onchange={handleTintAboveToggle} />
                <span class="track"></span>
            </span>
        </div>
        <div class="control-row" class:is-disabled={!tintAboveEnabled}>
            <input
                type="range"
                id="tint-above-elevation"
                min="0"
                max="4600"
                step="50"
                bind:value={tintAboveElevation}
                oninput={updateTintAboveExpression}
                disabled={!tintAboveEnabled}
            />
            <input
                type="number"
                class="value-input"
                aria-label="Highlight above elevation, feet"
                min="0"
                max="4600"
                bind:value={tintAboveElevation}
                oninput={updateTintAboveExpression}
                disabled={!tintAboveEnabled}
            />
            <span class="unit">ft</span>
        </div>
    </div>
    <div class="control">
        <div class="control-label-row">
            <label for="tint-below-enabled">Highlight below elevation</label>
            <span class="switch">
                <input type="checkbox" id="tint-below-enabled" bind:checked={tintBelowEnabled} onchange={handleTintBelowToggle} />
                <span class="track"></span>
            </span>
        </div>
        <div class="control-row" class:is-disabled={!tintBelowEnabled}>
            <input
                type="range"
                id="tint-below-elevation"
                min="0"
                max="4600"
                step="50"
                bind:value={tintBelowElevation}
                oninput={updateTintBelowExpression}
                disabled={!tintBelowEnabled}
            />
            <input
                type="number"
                class="value-input"
                aria-label="Highlight below elevation, feet"
                min="0"
                max="4600"
                bind:value={tintBelowElevation}
                oninput={updateTintBelowExpression}
                disabled={!tintBelowEnabled}
            />
            <span class="unit">ft</span>
        </div>
    </div>
    <div class="control">
        <div class="control-label-row">
            <label for="hypsometric-enabled">Hypsometric elevation tinting</label>
            <span class="switch">
                <input type="checkbox" id="hypsometric-enabled" bind:checked={hypsometricEnabled} onchange={handleHypsometricToggle} />
                <span class="track"></span>
            </span>
        </div>
    </div>
    <hr class="divider" />
    <div class="control">
        <div class="control-label-row">
            <label for="imagery-enabled">Imagery overlay</label>
            <span class="switch">
                <input type="checkbox" id="imagery-enabled" bind:checked={imageryEnabled} onchange={handleImageryToggle} />
                <span class="track"></span>
            </span>
        </div>
    </div>
    <hr class="divider" />
    <div class="control">
        <button
            id="profile-button"
            type="button"
            class:armed={profileArmed}
            onclick={() => (profileArmed = !profileArmed)}
        >
            {profileArmed ? 'Click two points on the map…' : 'Draw elevation profile'}
        </button>
    </div>
    <hr class="divider" />
    <div class="control">
        <a id="github-link" href="https://github.com/VCGI/terrain-tiles" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 19 19" aria-hidden="true">
                <path fill="currentColor" fill-rule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" clip-rule="evenodd"/>
            </svg>
            View source on GitHub
        </a>
    </div>
</div>

<style>
    #panel-toggle {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 2;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        line-height: 1;
        color: #333;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        cursor: pointer;
    }

    #controls {
        display: none;
        position: absolute;
        top: 52px;
        right: 10px;
        z-index: 1;
        width: 270px;
        box-sizing: border-box;
        padding: 16px 18px;
        font-family: inherit;
        font-size: 13px;
        line-height: 1.4;
        color: #222;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
    }

    #controls.open {
        display: block;
    }

    #controls .control {
        margin-bottom: 14px;
    }

    #controls .control:last-child {
        margin-bottom: 0;
    }

    #controls .divider {
        border: none;
        border-top: 1px solid #eee;
        margin: 14px 0;
    }

    #controls .control-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    #controls .terrain-sources {
        display: flex;
        gap: 6px;
        margin-top: 8px;
    }

    #controls .terrain-sources .segmented-option {
        position: relative;
        flex: 1 1 0;
        text-align: center;
        padding: 6px 4px;
        font-size: 12px;
        color: #222;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    #controls .terrain-sources .segmented-option input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        margin: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    #controls .terrain-sources .segmented-option:has(input:checked) {
        color: #000;
        border-color: #000;
        font-weight: 600;
    }

    #controls .terrain-sources .segmented-option:has(input:focus-visible) {
        outline: 2px solid #000;
        outline-offset: 2px;
    }

    #controls .control-label-row label {
        cursor: pointer;
    }

    #controls .control-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
    }

    #controls .control-row.is-disabled {
        opacity: 0.45;
    }

    #controls .control-row.is-disabled input {
        pointer-events: none;
    }

    #controls .control-row input[type="range"] {
        flex: 1 1 auto;
        min-width: 0;
    }

    #controls .value {
        flex: 0 0 auto;
        width: 3em;
        text-align: right;
        color: #777;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    #controls .value-input {
        flex: 0 0 auto;
        width: 3.2em;
        text-align: right;
        color: #222;
        font: inherit;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        background: transparent;
        border: none;
        border-bottom: 1px solid transparent;
        padding: 0;
        -moz-appearance: textfield;
        appearance: textfield;
    }

    #controls .value-input:hover,
    #controls .value-input:focus {
        border-bottom-color: #999;
        outline: none;
    }

    #controls .value-input::-webkit-inner-spin-button,
    #controls .value-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    #controls .unit {
        flex: 0 0 auto;
        color: #777;
        font-size: 12px;
    }

    #controls input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 16px;
        background: transparent;
    }

    #controls input[type="range"]::-webkit-slider-runnable-track {
        height: 1px;
        background: #bbb;
    }

    #controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 2px;
        height: 14px;
        margin-top: -6.5px;
        background: #000;
        border-radius: 0;
        cursor: pointer;
    }

    #controls input[type="range"]::-moz-range-track {
        height: 1px;
        background: #bbb;
    }

    #controls input[type="range"]::-moz-range-thumb {
        width: 2px;
        height: 14px;
        background: #000;
        border: none;
        border-radius: 0;
        cursor: pointer;
    }

    #controls .switch {
        position: relative;
        display: inline-block;
        flex: 0 0 auto;
        width: 30px;
        height: 17px;
    }

    #controls .switch input {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
        z-index: 1;
    }

    #controls .switch .track {
        position: absolute;
        inset: 0;
        background: #ddd;
        border-radius: 17px;
        transition: background-color 0.15s ease;
        pointer-events: none;
    }

    #controls .switch .track::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 2px;
        width: 13px;
        height: 13px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
        transition: transform 0.15s ease;
    }

    #controls .switch input:checked + .track {
        background: #000;
    }

    #controls .switch input:checked + .track::before {
        transform: translateX(13px);
    }

    #github-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #555;
        font-size: 12px;
        text-decoration: none;
    }

    #github-link:hover {
        color: #000;
        text-decoration: underline;
    }

    #profile-button {
        width: 100%;
        padding: 8px 10px;
        font-family: inherit;
        font-size: 13px;
        line-height: 1.4;
        color: #222;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
    }

    #profile-button.armed {
        background: #000;
        color: #fff;
        border-color: #000;
    }

    /* Touch devices: thin desktop-tuned hit targets (2px slider thumbs, 30px
       switches) are hard to grab with a finger, so enlarge them here without
       changing the mouse-driven appearance. */
    @media (pointer: coarse) {
        #controls .switch {
            width: 44px;
            height: 24px;
        }

        #controls .switch .track::before {
            width: 18px;
            height: 18px;
        }

        #controls .switch input:checked + .track::before {
            transform: translateX(20px);
        }

        #controls input[type="range"] {
            height: 24px;
        }

        #controls input[type="range"]::-webkit-slider-thumb {
            width: 18px;
            height: 18px;
            margin-top: -9px;
            border-radius: 50%;
        }

        #controls input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
        }
    }

    /* Narrow screens: a 270px popover anchored top-right either crowds the
       map or runs off-screen, so switch to a full-width bottom sheet instead
       (same pattern ProfilePanel already uses for its own width). */
    @media (max-width: 640px) {
        #controls {
            top: auto;
            right: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            max-height: 70vh;
            overflow-y: auto;
            border-left: none;
            border-right: none;
            border-bottom: none;
            border-radius: 12px 12px 0 0;
            /* Above MapLibre's own control corners (z-index: 2), so the open
               sheet isn't overlapped by the bottom-right attribution icon. */
            z-index: 3;
        }
    }
</style>
