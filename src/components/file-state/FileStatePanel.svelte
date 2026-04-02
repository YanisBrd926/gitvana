<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gitEngine } from '../../lib/engine/git/GitEngine.js';
  import { eventBus } from '../../lib/engine/events/GameEventBus.js';
  import type { FileStatus } from '../../lib/engine/git/types.js';

  let files: FileStatus[] = $state([]);
  let initialized = $state(false);
  let currentBranch = $state<string | null>(null);
  let unsub: (() => void) | null = null;

  const workingFiles = $derived(files.filter((f) => !f.staged && f.status !== 'unchanged'));
  const stagedFiles = $derived(files.filter((f) => f.staged));
  const committedFiles = $derived(files.filter((f) => f.status === 'unchanged'));

  async function refreshState() {
    const state = await gitEngine.getState();
    files = state.files;
    initialized = state.initialized;
    currentBranch = state.currentBranch;
  }

  onMount(() => {
    unsub = eventBus.on('state:changed', refreshState);
    refreshState();
  });

  onDestroy(() => {
    unsub?.();
  });

  function statusIcon(status: FileStatus['status']): string {
    switch (status) {
      case 'untracked': return '?';
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'conflicted': return '!';
      default: return ' ';
    }
  }

  function statusColor(status: FileStatus['status']): string {
    switch (status) {
      case 'untracked': return '#5f574f';
      case 'modified': return '#ffa300';
      case 'added': return '#00e436';
      case 'deleted': return '#ff004d';
      case 'conflicted': return '#ff004d';
      default: return '#c2c3c7';
    }
  }
</script>

<div class="file-state-container">
  <div class="panel-header">
    <span class="panel-title">FILE STATE</span>
    {#if currentBranch}
      <span class="branch-badge">{currentBranch}</span>
    {/if}
  </div>

  {#if !initialized}
    <div class="empty-state">
      <span class="empty-icon">~</span>
      <span class="empty-text">No repository initialized</span>
      <span class="empty-hint">Type <code>git init</code> to start</span>
    </div>
  {:else}
    <div class="areas">
      <div class="area">
        <div class="area-header">
          <span class="area-label">WORKING DIR</span>
          <span class="area-count">{workingFiles.length}</span>
        </div>
        <div class="file-list">
          {#each workingFiles as file}
            <div class="file-entry" style="--status-color: {statusColor(file.status)}">
              <span class="file-status">[{statusIcon(file.status)}]</span>
              <span class="file-name">{file.path}</span>
            </div>
          {/each}
          {#if workingFiles.length === 0}
            <span class="area-empty">clean</span>
          {/if}
        </div>
      </div>

      <div class="area-arrow">▼</div>

      <div class="area">
        <div class="area-header">
          <span class="area-label">STAGING</span>
          <span class="area-count">{stagedFiles.length}</span>
        </div>
        <div class="file-list">
          {#each stagedFiles as file}
            <div class="file-entry" style="--status-color: {statusColor(file.status)}">
              <span class="file-status">[{statusIcon(file.status)}]</span>
              <span class="file-name">{file.path}</span>
            </div>
          {/each}
          {#if stagedFiles.length === 0}
            <span class="area-empty">empty</span>
          {/if}
        </div>
      </div>

      <div class="area-arrow">▼</div>

      <div class="area">
        <div class="area-header">
          <span class="area-label">REPOSITORY</span>
          <span class="area-count">{committedFiles.length}</span>
        </div>
        <div class="file-list">
          {#each committedFiles as file}
            <div class="file-entry" style="--status-color: #c2c3c7">
              <span class="file-status">[✓]</span>
              <span class="file-name">{file.path}</span>
            </div>
          {/each}
          {#if committedFiles.length === 0}
            <span class="area-empty">no commits</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .file-state-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0a0a0a;
    border: 1px solid #2a2a4e;
    border-radius: 4px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4e;
  }

  .panel-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #5f574f;
    letter-spacing: 2px;
  }

  .branch-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #29adff;
    background: #29adff22;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid #29adff44;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 8px;
    padding: 24px;
  }

  .empty-icon {
    font-size: 32px;
    color: #5f574f;
    font-family: 'Press Start 2P', monospace;
  }

  .empty-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #5f574f;
  }

  .empty-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #5f574f88;
  }

  .empty-hint code {
    color: #00e436;
    background: #00e43622;
    padding: 1px 4px;
    border-radius: 2px;
  }

  .areas {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
    min-height: 0;
    overflow: hidden;
  }

  .area {
    background: #1a1a2e44;
    border: 1px solid #2a2a4e;
    border-radius: 4px;
    padding: 6px 8px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .area-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .area-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #5f574f;
    letter-spacing: 1px;
  }

  .area-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #5f574f;
    background: #5f574f22;
    padding: 1px 6px;
    border-radius: 3px;
  }

  .area-arrow {
    text-align: center;
    color: #5f574f44;
    font-size: 10px;
    line-height: 1;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .file-entry {
    display: flex;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .file-entry:hover {
    background: #ffffff08;
  }

  .file-status {
    color: var(--status-color);
    font-weight: bold;
    flex-shrink: 0;
  }

  .file-name {
    color: #c2c3c7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .area-empty {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #5f574f44;
    font-style: italic;
  }
</style>
