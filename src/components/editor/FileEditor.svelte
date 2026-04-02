<script lang="ts">
  import { gitEngine } from '../../lib/engine/git/GitEngine.js';
  import { eventBus } from '../../lib/engine/events/GameEventBus.js';

  interface Props {
    filepath: string;
    onClose: () => void;
  }

  let { filepath, onClose }: Props = $props();

  let content = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let textareaEl: HTMLTextAreaElement;

  const fullPath = `${gitEngine.dir}/${filepath}`;

  async function loadFile() {
    try {
      const data = await gitEngine.fs.promises.readFile(fullPath, { encoding: 'utf8' });
      content = data as string;
    } catch {
      content = '';
    }
    loading = false;
    // Focus textarea after render
    requestAnimationFrame(() => textareaEl?.focus());
  }

  async function save() {
    saving = true;
    await gitEngine.fs.promises.writeFile(fullPath, content, { encoding: 'utf8' });
    saving = false;
    eventBus.emit('state:changed', undefined as never);
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }

  loadFile();
</script>

<div class="editor-overlay" onkeydown={handleKeydown} role="dialog" aria-label="File editor">
  <div class="editor-card">
    <div class="editor-header">
      <span class="editor-filepath">{filepath}</span>
      <div class="editor-actions">
        <button class="btn-save" onclick={save} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button class="btn-close" onclick={onClose}>ESC</button>
      </div>
    </div>

    <div class="editor-hint">Ctrl/Cmd+S to save, Esc to cancel</div>

    {#if loading}
      <div class="editor-loading">Loading...</div>
    {:else}
      <textarea
        bind:this={textareaEl}
        bind:value={content}
        class="editor-textarea"
        spellcheck="false"
      ></textarea>
    {/if}
  </div>
</div>

<style>
  .editor-overlay {
    position: fixed;
    inset: 0;
    background: #0a0a0add;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .editor-card {
    background: #1a1a2e;
    border: 2px solid #29adff;
    border-radius: 6px;
    width: 90%;
    max-width: 600px;
    height: 70%;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #29adff22;
    border-bottom: 1px solid #29adff44;
  }

  .editor-filepath {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #29adff;
  }

  .editor-actions {
    display: flex;
    gap: 8px;
  }

  .btn-save, .btn-close {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    padding: 4px 10px;
    border: 1px solid;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-save {
    color: #0a0a0a;
    background: #00e436;
    border-color: #00e436;
  }

  .btn-save:hover { background: #00ff41; }
  .btn-save:disabled { opacity: 0.5; cursor: default; }

  .btn-close {
    color: #c2c3c7;
    background: transparent;
    border-color: #5f574f;
  }

  .btn-close:hover { background: #5f574f33; }

  .editor-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #5f574f;
    padding: 4px 12px;
    border-bottom: 1px solid #2a2a4e;
  }

  .editor-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5f574f;
    font-family: 'JetBrains Mono', monospace;
  }

  .editor-textarea {
    flex: 1;
    background: #0a0a0a;
    color: #c2c3c7;
    border: none;
    padding: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    outline: none;
    tab-size: 2;
  }

  .editor-textarea::selection {
    background: #29adff33;
  }
</style>
