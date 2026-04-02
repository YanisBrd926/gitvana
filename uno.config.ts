import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  theme: {
    colors: {
      // PICO-8 inspired palette
      bg: '#0a0a0a',
      terminal: '#00ff41',
      'terminal-dim': '#00aa2a',
      accent: '#ff004d',
      warn: '#ffa300',
      info: '#29adff',
      success: '#00e436',
      muted: '#5f574f',
      panel: '#1a1a2e',
      'panel-border': '#2a2a4e',
    },
    fontFamily: {
      retro: ['"Press Start 2P"', 'monospace'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
  },
});
