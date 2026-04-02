<script lang="ts">
  interface Props {
    id: string;
    size?: number;
  }

  let { id, size = 96 }: Props = $props();

  // Try to load a sprite PNG, fall back to a default
  const src = $derived(`/sprites/${id}.png`);
  let failed = $state(false);
</script>

{#if !failed}
  <img
    {src}
    alt="Level illustration"
    width={size}
    height={size}
    class="pixel-art"
    onerror={() => failed = true}
  />
{:else}
  <div class="pixel-fallback" style="width: {size}px; height: {size}px">
    <span class="fallback-icon">?</span>
  </div>
{/if}

<style>
  .pixel-art {
    image-rendering: pixelated;
    display: block;
    object-fit: contain;
  }

  .pixel-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    border: 1px dashed #2a2a4e;
    border-radius: 4px;
  }

  .fallback-icon {
    font-family: 'Press Start 2P', monospace;
    font-size: 24px;
    color: #5f574f44;
  }
</style>
