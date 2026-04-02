export type SoundType =
  | 'commit'
  | 'error'
  | 'add'
  | 'checkout'
  | 'merge'
  | 'conflict'
  | 'levelComplete'
  | 'levelStart'
  | 'hint';

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.3;

  private getCtx(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(sound: SoundType) {
    if (!this.enabled) return;

    const ctx = this.getCtx();
    if (!ctx) return;

    // Resume context if suspended (browsers require user gesture)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    switch (sound) {
      case 'commit':
        this.playCommit();
        break;
      case 'error':
        this.playError();
        break;
      case 'add':
        this.playAdd();
        break;
      case 'checkout':
        this.playCheckout();
        break;
      case 'merge':
        this.playMerge();
        break;
      case 'conflict':
        this.playConflict();
        break;
      case 'levelComplete':
        this.playLevelComplete();
        break;
      case 'levelStart':
        this.playLevelStart();
        break;
      case 'hint':
        this.playHint();
        break;
    }
  }

  /** Success bleep - short ascending two-tone (coin pickup). ~150ms */
  private playCommit() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.07); // G5
    gain.gain.setValueAtTime(this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /** Fail buzz - short low descending tone. ~200ms */
  private playError() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /** Soft click - very short high-pitched tick. ~50ms */
  private playAdd() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  /** Whoosh - quick frequency sweep down. ~150ms */
  private playCheckout() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /** Celebratory - three ascending tones. ~300ms */
  private playMerge() {
    const ctx = this.getCtx();
    const notes = [523, 659, 784]; // C5, E5, G5
    const dur = 0.09;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const t = ctx.currentTime + i * dur;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur + 0.05);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  /** Warning - two alternating harsh tones. ~400ms */
  private playConflict() {
    const ctx = this.getCtx();
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(i % 2 === 0 ? 220 : 185, t);
      gain.gain.setValueAtTime(this.volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  /** Victory fanfare - ascending arpeggio, 5 notes. ~600ms */
  private playLevelComplete() {
    const ctx = this.getCtx();
    const notes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6
    const dur = 0.11;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const t = ctx.currentTime + i * dur;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur + 0.08);
      osc.start(t);
      osc.stop(t + dur + 0.08);
    });
  }

  /** Ready - two quick beeps. ~200ms */
  private playLevelStart() {
    const ctx = this.getCtx();
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(this.volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  /** Gentle bell - single soft tone with decay. ~300ms */
  private playHint() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1047, ctx.currentTime); // C6
    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }
}

export const soundManager = new SoundManager();
