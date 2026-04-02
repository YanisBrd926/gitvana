<script lang="ts">
  import git from 'isomorphic-git';
  import { gitEngine } from '../../lib/engine/git/GitEngine.js';
  import { eventBus } from '../../lib/engine/events/GameEventBus.js';

  interface Props {
    filepath: string;
    onClose: () => void;
    onSave: () => void;
  }

  let { filepath, onClose, onSave }: Props = $props();

  let loading = $state(true);
  let saving = $state(false);
  let oursContent = $state('');
  let theirsContent = $state('');
  let resultContent = $state('');
  let rawContent = $state('');

  const fullPath = `${gitEngine.dir}/${filepath}`;

  function parseConflicts(text: string): { ours: string; theirs: string } {
    const lines = text.split('\n');
    let ours = '';
    let theirs = '';
    let region: 'none' | 'ours' | 'theirs' = 'none';
    const beforeConflict: string[] = [];
    const afterConflict: string[] = [];
    let pastConflict = false;

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        region = 'ours';
        continue;
      }
      if (line === '=======') {
        region = 'theirs';
        continue;
      }
      if (line.startsWith('>>>>>>>')) {
        region = 'none';
        pastConflict = true;
        continue;
      }

      if (region === 'ours') {
        ours += (ours ? '\n' : '') + line;
      } else if (region === 'theirs') {
        theirs += (theirs ? '\n' : '') + line;
      } else if (!pastConflict) {
        beforeConflict.push(line);
      } else {
        afterConflict.push(line);
      }
    }

    // Include non-conflicted content as context
    const prefix = beforeConflict.length ? beforeConflict.join('\n') + '\n' : '';
    const suffix = afterConflict.length ? '\n' + afterConflict.join('\n') : '';

    return {
      ours: prefix + ours + suffix,
      theirs: prefix + theirs + suffix,
    };
  }

  async function loadFile() {
    try {
      const data = await gitEngine.fs.promises.readFile(fullPath, { encoding: 'utf8' });
      rawContent = data as string;
      const parsed = parseConflicts(rawContent);
      oursContent = parsed.ours;
      theirsContent = parsed.theirs;
      resultContent = parsed.ours; // Default to ours
    } catch {
      rawContent = '';
      oursContent = '';
      theirsContent = '';
      resultContent = '';
    }
    loading = false;
  }

  function takeOurs() {
    resultContent = oursContent;
  }

  function takeTheirs() {
    resultContent = theirsContent;
  }

  function takeBoth() {
    resultContent = oursContent + '\n' + theirsContent;
  }

  async function save() {
    saving = true;
    await gitEngine.fs.promises.writeFile(fullPath, resultContent, { encoding: 'utf8' });
    await git.add({ fs: gitEngine.fs, dir: gitEngine.dir, filepath });
    saving = false;
    eventBus.emit('state:changed', undefined as never);
    onSave();
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

<div class="conflict-overlay" onkeydown={handleKeydown} role="dialog" aria-label="Conflict editor">
  <div class="conflict-card">
    <div class="conflict-header">
      <div class="conflict-title-row">
        <span class="conflict-filepath">{filepath}</span>
        <span class="conflict-badge">RESOLVE CONFLICT</span>
      </div>
      <div class="conflict-actions">
        <button class="btn-action btn-take-ours" onclick={takeOurs}>TAKE OURS</button>
        <button class="btn-action btn-take-theirs" onclick={takeTheirs}>TAKE THEIRS</button>
        <button class="btn-action btn-take-both" onclick={takeBoth}>TAKE BOTH</button>
        <button class="btn-save" onclick={save} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button class="btn-close" onclick={onClose}>ESC</button>
      </div>
    </div>

    <div class="conflict-hint">Ctrl/Cmd+S to save & stage, Esc to cancel</div>

    {#if loading}
      <div class="conflict-loading">Loading...</div>
    {:else}
      <div class="panels">
        <div class="panel panel-ours">
          <div class="panel-label panel-label-ours">OURS (HEAD)</div>
          <textarea
            class="panel-textarea textarea-ours"
            readonly
            spellcheck="false"
            value={oursContent}
          ></textarea>
        </div>

        <div class="panel panel-result">
          <div class="panel-label panel-label-result">RESULT</div>
          <textarea
            class="panel-textarea textarea-result"
            spellcheck="false"
            bind:value={resultContent}
          ></textarea>
        </div>

        <div class="panel panel-theirs">
          <div class="panel-label panel-label-theirs">THEIRS (INCOMING)</div>
          <textarea
            class="panel-textarea textarea-theirs"
            readonly
            spellcheck="false"
            value={theirsContent}
          ></textarea>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .conflict-overlay {
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

  .conflict-card {
    background: #1a1a2e;
    border: 2px solid #2a2a4e;
    border-radius: 6px;
    width: 95%;
    max-width: 1200px;
    height: 80%;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .conflict-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #2a2a4e22;
    border-bottom: 1px solid #2a2a4e;
    flex-wrap: wrap;
    gap: 6px;
  }

  .conflict-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .conflict-filepath {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #c2c3c7;
  }

  .conflict-badge {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #ff004d;
    background: #ff004d22;
    padding: 3px 8px;
    border: 1px solid #ff004d44;
    border-radius: 3px;
  }

  .conflict-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .btn-action, .btn-save, .btn-close {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 4px 8px;
    border: 1px solid;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-take-ours {
    color: #00e436;
    background: #00e43611;
    border-color: #00e43644;
  }
  .btn-take-ours:hover { background: #00e43622; }

  .btn-take-theirs {
    color: #29adff;
    background: #29adff11;
    border-color: #29adff44;
  }
  .btn-take-theirs:hover { background: #29adff22; }

  .btn-take-both {
    color: #ffec27;
    background: #ffec2711;
    border-color: #ffec2744;
  }
  .btn-take-both:hover { background: #ffec2722; }

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

  .conflict-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #5f574f;
    padding: 4px 12px;
    border-bottom: 1px solid #2a2a4e;
  }

  .conflict-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5f574f;
    font-family: 'JetBrains Mono', monospace;
  }

  .panels {
    flex: 1;
    display: flex;
    gap: 1px;
    background: #2a2a4e;
    min-height: 0;
  }

  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .panel-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 5px 10px;
    text-align: center;
    letter-spacing: 1px;
  }

  .panel-label-ours {
    color: #00e436;
    background: #00e43612;
    border-bottom: 1px solid #00e43633;
  }

  .panel-label-result {
    color: #ffec27;
    background: #ffec2712;
    border-bottom: 1px solid #ffec2733;
  }

  .panel-label-theirs {
    color: #29adff;
    background: #29adff12;
    border-bottom: 1px solid #29adff33;
  }

  .panel-textarea {
    flex: 1;
    background: #0a0a0a;
    color: #c2c3c7;
    border: none;
    padding: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    outline: none;
    tab-size: 2;
    min-height: 0;
  }

  .panel-textarea::selection {
    background: #29adff33;
  }

  .textarea-ours {
    background: #0a0a0a;
    border-left: 2px solid #00e43633;
  }

  .textarea-result {
    background: #0d0d0d;
  }

  .textarea-theirs {
    background: #0a0a0a;
    border-right: 2px solid #29adff33;
  }

  .textarea-ours:focus,
  .textarea-theirs:focus {
    outline: none;
  }

  .textarea-result:focus {
    outline: 1px solid #ffec2744;
  }
</style>
