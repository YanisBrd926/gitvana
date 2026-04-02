import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import 'virtual:uno.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { initTelemetry } from './lib/telemetry.js';

const app = mount(App, {
  target: document.getElementById('app')!,
});

initTelemetry();

export default app;
