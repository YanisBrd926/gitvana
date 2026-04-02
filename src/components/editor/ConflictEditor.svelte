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
  let resultContent = $state('');
  let manualEditMode = $state(false);

  interface ConflictHunk {
    id: number;
    ours: string;
    theirs: string;
    resolved: boolean;
    resolution: string;
  }

  interface FileSection {
    type: 'context' | 'conflict';
    content?: string;
    hunk?: ConflictHunk;
  }

  let sections = $state<FileSection[]>([]);

  const resolvedCount = $derived(
    sections.filter((s) => s.type === 'conflict' && s.hunk?.resolved).length
  );
  const totalConflicts = $derived(
    sections.filter((s) => s.type === 'conflict').length
  );
  const allResolved = $derived(resolvedCount === totalConflicts && totalConflicts > 0);

  const fullPath = `${gitEngine.dir}/${filepath}`;

  function parseFileIntoSections(text: string): FileSection[] {
    const lines = text.split('\n');
    const result: FileSection[] = [];
    let contextLines: string[] = [];
    let oursLines: string[] = [];
    let theirsLines: string[] = [];
    let region: 'none' | 'ours' | 'theirs' = 'none';
    let hunkId = 0;

    function flushContext() {
      if (contextLines.length > 0) {
        result.push({ type: 'context', content: contextLines.join('\n') });
        contextLines = [];
      }
    }

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        flushContext();
        region = 'ours';
        oursLines = [];
        theirsLines = [];
        continue;
      }
      if (line === '=======' && region === 'ours') {
        region = 'theirs';
        continue;
      }
      if (line.startsWith('>>>>>>>') && region === 'theirs') {
        result.push({
          type: 'conflict',
          hunk: {
            id: hunkId++,
            ours: oursLines.join('\n'),
            theirs: theirsLines.join('\n'),
            resolved: false,
            resolution: '',
          },
        });
        region = 'none';
        continue;
      }

      if (region === 'ours') {
        oursLines.push(line);
      } else if (region === 'theirs') {
        theirsLines.push(line);
      } else {
        contextLines.push(line);
      }
    }

    flushContext();
    return result;
  }

  function assembleResult(): string {
    return sections
      .map((s) => {
        if (s.type === 'context') return s.content ?? '';
        if (s.type === 'conflict' && s.hunk) {
          return s.hunk.resolved ? s.hunk.resolution : `\u26A0 UNRESOLVED CONFLICT ${s.hunk.id + 1}`;
        }
        return '';
      })
      .join('\n');
  }

  function updateResult() {
    if (!manualEditMode) {
      resultContent = assembleResult();
    }
  }

  function takeOursHunk(hunk: ConflictHunk) {
    hunk.resolved = true;
    hunk.resolution = hunk.ours;
    updateResult();
  }

  function takeTheirsHunk(hunk: ConflictHunk) {
    hunk.resolved = true;
    hunk.resolution = hunk.theirs;
    updateResult();
  }

  function takeBothHunk(hunk: ConflictHunk) {
    hunk.resolved = true;
    hunk.resolution = hunk.ours + (hunk.ours && hunk.theirs ? '\n' : '') + hunk.theirs;
    updateResult();
  }

  function unresolveHunk(hunk: ConflictHunk) {
    hunk.resolved = false;
    hunk.resolution = '';
    updateResult();
  }

  function takeAllOurs() {
    for (const s of sections) {
      if (s.type === 'conflict' && s.hunk) {
        s.hunk.resolved = true;
        s.hunk.resolution = s.hunk.ours;
      }
    }
    updateResult();
  }

  function takeAllTheirs() {
    for (const s of sections) {
      if (s.type === 'conflict' && s.hunk) {
        s.hunk.resolved = true;
        s.hunk.resolution = s.hunk.theirs;
      }
    }
    updateResult();
  }

  function takeAllBoth() {
    for (const s of sections) {
      if (s.type === 'conflict' && s.hunk) {
        s.hunk.resolved = true;
        s.hunk.resolution = s.hunk.ours + (s.hunk.ours && s.hunk.theirs ? '\n' : '') + s.hunk.theirs;
      }
    }
    updateResult();
  }

  function toggleManualEdit() {
    manualEditMode = !manualEditMode;
  }

  async function loadFile() {
    try {
      const data = await gitEngine.fs.promises.readFile(fullPath, { encoding: 'utf8' });
      const raw = data as string;
      sections = parseFileIntoSections(raw);
      resultContent = assembleResult();
    } catch {
      sections = [];
      resultContent = '';
    }
    loading = false;
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
      if (allResolved || manualEditMode) {
        save();
      }
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
        {#if totalConflicts > 0}
          <span class="conflict-progress" class:all-done={allResolved}>
            {resolvedCount} of {totalConflicts} resolved
          </span>
        {/if}
      </div>
      <div class="conflict-actions">
        <button class="btn-action btn-take-ours" onclick={takeAllOurs}>ALL OURS</button>
        <button class="btn-action btn-take-theirs" onclick={takeAllTheirs}>ALL THEIRS</button>
        <button class="btn-action btn-take-both" onclick={takeAllBoth}>ALL BOTH</button>
        <button
          class="btn-action btn-manual"
          class:btn-manual-active={manualEditMode}
          onclick={toggleManualEdit}
        >MANUAL</button>
        <button
          class="btn-save"
          onclick={save}
          disabled={saving || (!allResolved && !manualEditMode)}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button class="btn-close" onclick={onClose}>ESC</button>
      </div>
    </div>

    <div class="conflict-hint">
      {#if manualEditMode}
        Manual edit mode — edit the result directly. Ctrl/Cmd+S to save & stage, Esc to cancel
      {:else}
        Resolve each conflict below. Ctrl/Cmd+S to save & stage, Esc to cancel
      {/if}
    </div>

    {#if loading}
      <div class="conflict-loading">Loading...</div>
    {:else}
      <div class="editor-body">
        <div class="hunks-panel">
          {#each sections as section, i (i)}
            {#if section.type === 'context'}
              <div class="context-section">
                <pre class="context-content">{section.content}</pre>
              </div>
            {:else if section.hunk}
              {@const hunk = section.hunk}
              <div
                class="conflict-section"
                class:conflict-resolved={hunk.resolved}
                class:conflict-unresolved={!hunk.resolved}
              >
                <div class="conflict-section-header">
                  <span class="conflict-section-label">
                    {#if hunk.resolved}
                      <span class="resolved-check">&#10003;</span> Conflict {hunk.id + 1} — resolved
                    {:else}
                      <span class="unresolved-warn">&#9888;</span> Conflict {hunk.id + 1}
                    {/if}
                  </span>
                  {#if hunk.resolved}
                    <button class="btn-undo" onclick={() => unresolveHunk(hunk)}>UNDO</button>
                  {/if}
                </div>

                {#if !hunk.resolved}
                  <div class="hunk-panels">
                    <div class="hunk-side hunk-ours">
                      <div class="hunk-side-label hunk-label-ours">OURS (HEAD)</div>
                      <pre class="hunk-code hunk-code-ours">{hunk.ours || '(empty)'}</pre>
                    </div>
                    <div class="hunk-side hunk-theirs">
                      <div class="hunk-side-label hunk-label-theirs">THEIRS (INCOMING)</div>
                      <pre class="hunk-code hunk-code-theirs">{hunk.theirs || '(empty)'}</pre>
                    </div>
                  </div>
                  <div class="hunk-actions">
                    <button class="btn-hunk btn-hunk-ours" onclick={() => takeOursHunk(hunk)}>TAKE OURS</button>
                    <button class="btn-hunk btn-hunk-both" onclick={() => takeBothHunk(hunk)}>TAKE BOTH</button>
                    <button class="btn-hunk btn-hunk-theirs" onclick={() => takeTheirsHunk(hunk)}>TAKE THEIRS</button>
                  </div>
                {:else}
                  <div class="resolved-preview">
                    <pre class="resolved-code">{hunk.resolution || '(empty)'}</pre>
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>

        <div class="result-panel">
          <div class="panel-label panel-label-result">
            RESULT
            {#if manualEditMode}
              <span class="manual-badge">MANUAL</span>
            {/if}
          </div>
          <textarea
            class="panel-textarea textarea-result"
            spellcheck="false"
            readonly={!manualEditMode}
            bind:value={resultContent}
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

  @keyframes pulse {
    0%, 100% { border-color: #ff004d88; }
    50% { border-color: #ff004ddd; }
  }

  .conflict-card {
    background: #1a1a2e;
    border: 2px solid #2a2a4e;
    border-radius: 6px;
    width: 95%;
    max-width: 1400px;
    height: 85%;
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

  .conflict-progress {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #ffec27;
    background: #ffec2715;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid #ffec2733;
  }

  .conflict-progress.all-done {
    color: #00e436;
    background: #00e43615;
    border-color: #00e43633;
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

  .btn-manual {
    color: #c2c3c7;
    background: transparent;
    border-color: #5f574f;
  }
  .btn-manual:hover { background: #5f574f33; }
  .btn-manual-active {
    color: #ffec27;
    background: #ffec2722;
    border-color: #ffec27;
  }

  .btn-save {
    color: #0a0a0a;
    background: #00e436;
    border-color: #00e436;
  }
  .btn-save:hover { background: #00ff41; }
  .btn-save:disabled { opacity: 0.4; cursor: default; }

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

  /* Layout: hunks on left, result on right */
  .editor-body {
    flex: 1;
    display: flex;
    gap: 1px;
    background: #2a2a4e;
    min-height: 0;
  }

  .hunks-panel {
    flex: 1;
    overflow-y: auto;
    background: #0d0d12;
    min-width: 0;
  }

  .result-panel {
    width: 38%;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Context sections */
  .context-section {
    border-left: 3px solid #2a2a4e44;
    margin: 0;
  }

  .context-content {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #5f574f;
    padding: 6px 12px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Conflict sections */
  .conflict-section {
    margin: 4px 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .conflict-unresolved {
    border-left: 3px solid #ff004d;
    animation: pulse 2s ease-in-out infinite;
    background: #ff004d08;
  }

  .conflict-resolved {
    border-left: 3px solid #00e43688;
    background: #00e43608;
    opacity: 0.75;
  }

  .conflict-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 12px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4e44;
  }

  .conflict-section-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #c2c3c7;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .resolved-check {
    color: #00e436;
    font-size: 12px;
  }

  .unresolved-warn {
    color: #ff004d;
    font-size: 12px;
  }

  .btn-undo {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    color: #c2c3c7;
    background: transparent;
    border: 1px solid #5f574f;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
  }
  .btn-undo:hover { background: #5f574f33; }

  /* Hunk panels: side by side ours/theirs */
  .hunk-panels {
    display: flex;
    gap: 1px;
    background: #2a2a4e44;
  }

  .hunk-side {
    flex: 1;
    min-width: 0;
  }

  .hunk-side-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    padding: 3px 10px;
    text-align: center;
    letter-spacing: 1px;
  }

  .hunk-label-ours {
    color: #00e436;
    background: #00e43615;
    border-bottom: 1px solid #00e43633;
  }

  .hunk-label-theirs {
    color: #29adff;
    background: #29adff15;
    border-bottom: 1px solid #29adff33;
  }

  .hunk-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #c2c3c7;
    padding: 8px 10px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    min-height: 24px;
  }

  .hunk-code-ours {
    background: #00e43609;
  }

  .hunk-code-theirs {
    background: #29adff09;
  }

  /* Per-hunk action buttons */
  .hunk-actions {
    display: flex;
    gap: 4px;
    padding: 6px 10px;
    background: #1a1a2e;
    justify-content: center;
  }

  .btn-hunk {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 5px 12px;
    border: 1px solid;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }

  .btn-hunk:hover {
    transform: translateY(-1px);
  }

  .btn-hunk-ours {
    color: #00e436;
    background: #00e43618;
    border-color: #00e43655;
  }
  .btn-hunk-ours:hover { background: #00e43630; }

  .btn-hunk-theirs {
    color: #29adff;
    background: #29adff18;
    border-color: #29adff55;
  }
  .btn-hunk-theirs:hover { background: #29adff30; }

  .btn-hunk-both {
    color: #ffec27;
    background: #ffec2718;
    border-color: #ffec2755;
  }
  .btn-hunk-both:hover { background: #ffec2730; }

  /* Resolved preview */
  .resolved-preview {
    padding: 0;
  }

  .resolved-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #00e436aa;
    background: #00e43608;
    padding: 8px 10px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Result panel */
  .panel-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 5px 10px;
    text-align: center;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .panel-label-result {
    color: #ffec27;
    background: #ffec2712;
    border-bottom: 1px solid #ffec2733;
  }

  .manual-badge {
    font-size: 6px;
    background: #ffec2733;
    padding: 1px 5px;
    border-radius: 2px;
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

  .textarea-result {
    background: #0d0d0d;
  }

  .textarea-result:focus {
    outline: 1px solid #ffec2744;
  }

  .textarea-result[readonly] {
    cursor: default;
  }
</style>
