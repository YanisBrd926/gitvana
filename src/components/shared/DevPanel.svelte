<script lang="ts">
  import type { LevelDefinition } from '../../levels/schema.js';
  import { getLevelSolution } from '../../lib/engine/shell/solutions.js';

  interface Props {
    level: LevelDefinition;
    onSolve: () => void;
    onSkip: () => void;
    onReset: () => void;
  }

  let { level, onSolve, onSkip, onReset }: Props = $props();

  let open = $state(false);
  let showSolution = $state(false);

  const solution = $derived(getLevelSolution(level.id));

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '`' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open = !open;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<button class="dev-toggle" onclick={() => open = !open} title="Dev Panel (Cmd+`)">
  {open ? '✕' : '⚙'}
</button>

{#if open}
  <div class="dev-panel">
    <div class="dev-header">DEV TOOLS</div>

    <div class="dev-info">
      <span class="dev-label">Level:</span>
      <span class="dev-value">{level.id}</span>
    </div>
    <div class="dev-info">
      <span class="dev-label">Act {level.act}</span>
      <span class="dev-value">#{level.order}</span>
    </div>

    <div class="dev-divider"></div>

    <button class="dev-btn solve" onclick={onSolve}>
      ▶ Auto-Solve
    </button>
    <button class="dev-btn skip" onclick={onSkip}>
      ⏭ Skip Level
    </button>

    <div class="dev-divider"></div>

    <button class="dev-btn reset" onclick={onReset}>
      RESET PROGRESS
    </button>

    <div class="dev-divider"></div>

    <button class="dev-btn solution" onclick={() => showSolution = !showSolution}>
      {showSolution ? '▾ Hide Solution' : '▸ Show Solution'}
    </button>

    {#if showSolution}
      <ol class="solution-steps">
        {#each solution as step}
          <li>{step}</li>
        {/each}
        {#if solution.length === 0}
          <li class="no-solution">No solution defined</li>
        {/if}
      </ol>
    {/if}
  </div>
{/if}

<style>
  .dev-toggle {
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 200;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid #ffa30066;
    background: #1a1a2e;
    color: #ffa300;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.15s;
  }

  .dev-toggle:hover {
    opacity: 1;
  }

  .dev-panel {
    position: fixed;
    top: 42px;
    right: 8px;
    z-index: 200;
    width: 220px;
    background: #1a1a2e;
    border: 1px solid #ffa30044;
    border-radius: 6px;
    padding: 10px;
    animation: slideIn 0.15s ease;
    box-shadow: 0 4px 20px #00000088;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dev-header {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #ffa300;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .dev-info {
    display: flex;
    justify-content: space-between;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    padding: 2px 0;
  }

  .dev-label {
    color: #5f574f;
  }

  .dev-value {
    color: #c2c3c7;
  }

  .dev-divider {
    height: 1px;
    background: #2a2a4e;
    margin: 8px 0;
  }

  .dev-btn {
    display: block;
    width: 100%;
    padding: 6px 8px;
    margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    text-align: left;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .dev-btn.solve {
    color: #00e436;
    background: #00e43611;
    border-color: #00e43633;
  }
  .dev-btn.solve:hover { background: #00e43622; }

  .dev-btn.skip {
    color: #29adff;
    background: #29adff11;
    border-color: #29adff33;
  }
  .dev-btn.skip:hover { background: #29adff22; }

  .dev-btn.reset {
    color: #ff004d;
    background: #ff004d11;
    border-color: #ff004d33;
    font-size: 9px;
    letter-spacing: 1px;
    text-align: center;
  }
  .dev-btn.reset:hover { background: #ff004d22; }

  .dev-btn.solution {
    color: #ffa300;
    background: transparent;
    border-color: transparent;
    padding: 4px 8px;
    margin-bottom: 0;
  }
  .dev-btn.solution:hover { background: #ffa30011; }

  .solution-steps {
    list-style: none;
    padding: 6px 0 0;
    margin: 0;
    counter-reset: step;
  }

  .solution-steps li {
    counter-increment: step;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #c2c3c7;
    padding: 3px 0 3px 8px;
    position: relative;
  }

  .solution-steps li::before {
    content: counter(step) ".";
    color: #5f574f;
    position: absolute;
    left: -8px;
  }

  .no-solution {
    color: #5f574f;
    font-style: italic;
  }
</style>
