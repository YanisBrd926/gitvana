<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    terminalSlot: Snippet;
    fileStateSlot: Snippet;
    graphSlot?: Snippet;
    hudSlot?: Snippet;
  }

  let { terminalSlot, fileStateSlot, graphSlot, hudSlot }: Props = $props();
</script>

<div class="game-layout">
  <div class="main-area">
    <div class="panel terminal-panel">
      {@render terminalSlot()}
    </div>
    <div class="right-column">
      <div class="panel filestate-panel">
        {@render fileStateSlot()}
      </div>
      {#if graphSlot}
        <div class="panel graph-panel">
          {@render graphSlot()}
        </div>
      {/if}
    </div>
  </div>
  {#if hudSlot}
    <div class="hud-area">
      {@render hudSlot()}
    </div>
  {/if}
</div>

<style>
  .game-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: #0a0a0a;
    overflow: hidden;
  }

  .main-area {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: 6px;
    padding: 6px;
  }

  .panel {
    min-height: 0;
    overflow: hidden;
  }

  .terminal-panel {
    flex: 3;
  }

  .right-column {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
  }

  .filestate-panel {
    flex: 1;
    min-height: 0;
  }

  .graph-panel {
    flex: 1;
    min-height: 0;
  }

  .hud-area {
    padding: 0 6px 6px;
  }
</style>
