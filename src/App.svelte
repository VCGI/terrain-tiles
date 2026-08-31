<script>
    import MapView from './lib/MapView.svelte';
    import ControlsPanel from './lib/ControlsPanel.svelte';
    import ProfilePanel from './lib/ProfilePanel.svelte';

    let map = $state(null);
    let is3d = $state(false);
    let terrainSource = $state('dem');
    let profileArmed = $state(false);
</script>

<MapView bind:map />
{#if map}
    <ControlsPanel {map} bind:is3d bind:terrainSource bind:profileArmed />
    <ProfilePanel {map} {is3d} {terrainSource} bind:armed={profileArmed} />
{/if}
