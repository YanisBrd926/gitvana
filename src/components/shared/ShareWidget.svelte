<script lang="ts">
  const url = 'https://gitvana.pixari.dev';
  const text = 'Learn git by playing — a retro browser game with real terminal commands. Free!';

  let open = $state(false);
  let copied = $state(false);

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  function shareLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }

  function shareReddit() {
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent('Gitvana — Learn git by playing a retro browser game')}`, '_blank');
  }

  function shareHN() {
    window.open(`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent('Gitvana – Learn git by playing a retro browser game')}`, '_blank');
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Gitvana', text, url });
    }
  }
</script>

<div class="share-widget">
  <button class="share-toggle" onclick={() => open = !open} title="Share Gitvana">
    {open ? '✕' : '↗'}
  </button>

  {#if open}
    <div class="share-menu">
      <button class="share-item" onclick={shareTwitter}>
        <span class="share-icon">𝕏</span>
        <span>Twitter</span>
      </button>
      <button class="share-item" onclick={shareLinkedIn}>
        <span class="share-icon">in</span>
        <span>LinkedIn</span>
      </button>
      <button class="share-item" onclick={shareReddit}>
        <span class="share-icon">r/</span>
        <span>Reddit</span>
      </button>
      <button class="share-item" onclick={shareHN}>
        <span class="share-icon">Y</span>
        <span>Hacker News</span>
      </button>
      <button class="share-item" onclick={copyLink}>
        <span class="share-icon">{copied ? '✓' : '🔗'}</span>
        <span>{copied ? 'Copied!' : 'Copy link'}</span>
      </button>
      {#if typeof navigator !== 'undefined' && navigator.share}
        <button class="share-item" onclick={nativeShare}>
          <span class="share-icon">📤</span>
          <span>Share...</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 180;
  }

  .share-toggle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffa300, #ff8c00);
    border: none;
    color: #0a0a0a;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px #ffa30044;
    transition: transform 0.15s, box-shadow 0.2s;
  }

  .share-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 20px #ffa30066;
  }

  .share-menu {
    position: absolute;
    bottom: 56px;
    right: 0;
    background: #1a1a2e;
    border: 1px solid #2a2a4e;
    border-radius: 8px;
    padding: 6px;
    min-width: 160px;
    box-shadow: 0 8px 32px #00000088;
    animation: popUp 0.15s ease;
  }

  @keyframes popUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .share-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 4px;
    color: #c2c3c7;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s;
    text-align: left;
  }

  .share-item:hover {
    background: #2a2a4e44;
  }

  .share-icon {
    width: 20px;
    text-align: center;
    font-weight: bold;
    font-size: 13px;
    color: #ffa300;
    flex-shrink: 0;
  }
</style>
