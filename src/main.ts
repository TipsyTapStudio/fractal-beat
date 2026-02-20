import './styles.css';
import { createScene } from './engine/scene';
import { TunnelEngine, PALETTES, type ShapeType } from './engine/tunnel';
import { TimingEngine } from './engine/timing';
import { AudioEngine } from './engine/audio';
import { createConsole } from './components/console';

// ── State ──
type AppState = 'idle' | 'running' | 'paused';

let state: AppState = 'idle';
let currentBpm = 120;
let currentShape: ShapeType = 'hexagon';
let currentPaletteName = 'Cyberpunk';
let clockMode = false;

// ── Init ──
const app = document.getElementById('app')!;
const ctx = createScene(app);
const tunnel = new TunnelEngine(ctx.scene);
const timing = new TimingEngine();
const audio = new AudioEngine();

// Ambient tunnel for idle state (slow BPM preview)
const idleTunnel = new TunnelEngine(ctx.scene);
idleTunnel.setBpm(30); // slow ambient
const initialPalette = PALETTES.find(p => p.name === currentPaletteName) ?? PALETTES[0]!;
tunnel.setPalette(initialPalette);
idleTunnel.setPalette(initialPalette);

// ── Console ──
const ui = createConsole(currentBpm, currentShape, currentPaletteName);
ui.setAutoHide(false);
applyPaletteAccent(initialPalette.accent);

function enterState(next: AppState): void {
  state = next;
  switch (next) {
    case 'idle':
      ui.setPaused(true);
      ui.setAutoHide(false);
      // Reset running tunnel, let idle tunnel keep going
      timing.reset();
      tunnel.reset();
      ctx.bloomPass.strength = 1.5;
      break;
    case 'running':
      ui.setPaused(false);
      ui.setAutoHide(true);
      // Hide idle tunnel shapes
      idleTunnel.reset();
      break;
    case 'paused':
      ui.setPaused(true);
      ui.setAutoHide(false);
      break;
  }
}

ui.onStart = () => {
  if (state === 'idle') {
    timing.reset();
    tunnel.reset();
    enterState('running');
  } else if (state === 'paused') {
    enterState('running');
  }
};

ui.onPause = () => {
  if (state === 'running') {
    enterState('paused');
  }
};

ui.onStop = () => {
  enterState('idle');
};

ui.onBpmChange = (bpm) => {
  currentBpm = bpm;
  timing.setBpm(bpm);
  if (!clockMode) tunnel.setBpm(bpm);
};

ui.onShapeChange = (shape) => {
  currentShape = shape;
  tunnel.setShape(shape);
  idleTunnel.setShape(shape);
};

ui.onMetronomeChange = (on) => {
  audio.setEnabled(on);
};

ui.onPaletteChange = (name) => {
  currentPaletteName = name;
  const palette = PALETTES.find(p => p.name === name);
  if (palette) {
    tunnel.setPalette(palette);
    idleTunnel.setPalette(palette);
    applyPaletteAccent(palette.accent);
  }
};

ui.onModeChange = (mode) => {
  clockMode = mode === 'clock';
  if (clockMode) {
    timing.setClockMode(true);
    tunnel.setClockMode();
  } else {
    timing.setClockMode(false);
    timing.setBpm(currentBpm);
    tunnel.setBpm(currentBpm);
  }
};

ui.onResetDefaults = () => {
  currentBpm = 120;
  currentShape = 'hexagon';
  currentPaletteName = 'Cyberpunk';
  clockMode = false;

  timing.setBpm(120);
  timing.setClockMode(false);
  tunnel.setBpm(120);
  tunnel.setShape('hexagon');
  idleTunnel.setShape('hexagon');
  idleTunnel.setBpm(30);
  const defPalette = PALETTES[0]!;
  tunnel.setPalette(defPalette);
  idleTunnel.setPalette(defPalette);
  applyPaletteAccent(defPalette.accent);
  audio.setEnabled(false);

  ui.setBpm(120);
  ui.closeDrawer();

  if (state !== 'idle') {
    enterState('idle');
  }
};

function applyPaletteAccent(hex: number): void {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  ui.setAccentColor([r, g, b]);
}

// ── Keyboard ──
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
    e.preventDefault();
    if (state === 'idle' || state === 'paused') {
      ui.onStart?.();
    } else if (state === 'running') {
      ui.onPause?.();
    }
  }
});

// ── Main loop ──
let bloomTarget = 1.5;
let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  let dt = (now - lastTime) / 1000;
  lastTime = now;

  // Cap dt to prevent large jumps (tab switch)
  dt = Math.min(dt, 0.1);

  if (state === 'running') {
    const beat = timing.update(dt);

    if (beat.isNewBeat) {
      tunnel.applyBeatKick();
      bloomTarget = 2.5;
      audio.playClick(beat.beatIndex % 4 === 0);
    }

    tunnel.update(dt);
  } else if (state === 'idle') {
    // Ambient slow tunnel in idle state
    idleTunnel.update(dt);
  }

  // Bloom decay
  const bloomDecaySpeed = 5.0;
  if (ctx.bloomPass.strength < bloomTarget) {
    ctx.bloomPass.strength = Math.min(bloomTarget, ctx.bloomPass.strength + bloomDecaySpeed * dt);
  } else if (ctx.bloomPass.strength > 1.5) {
    ctx.bloomPass.strength = Math.max(1.5, ctx.bloomPass.strength - bloomDecaySpeed * dt);
    if (ctx.bloomPass.strength <= 1.5) {
      bloomTarget = 1.5;
    }
  }

  ctx.composer.render();
}

// Set initial timing
timing.setBpm(currentBpm);
tunnel.setBpm(currentBpm);

animate();
