import { PALETTES, type ShapeType } from '../engine/tunnel';

export interface ConsoleController {
  el: HTMLElement;
  show(): void;
  hide(): void;
  onStart: (() => void) | null;
  onPause: (() => void) | null;
  onStop: (() => void) | null;
  onBpmChange: ((bpm: number) => void) | null;
  onShapeChange: ((shape: ShapeType) => void) | null;
  onMetronomeChange: ((on: boolean) => void) | null;
  onPaletteChange: ((name: string) => void) | null;
  onModeChange: ((mode: 'bpm' | 'clock') => void) | null;
  onResetDefaults: (() => void) | null;
  setPaused(paused: boolean): void;
  setAccentColor(rgb: [number, number, number]): void;
  setBpm(bpm: number): void;
  setAutoHide(enabled: boolean): void;
  closeDrawer(): void;
}

function injectStyles(): void {
  if (document.getElementById('fb-console-style')) return;
  const style = document.createElement('style');
  style.id = 'fb-console-style';
  style.textContent = `
    .fb-controls {
      position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
      z-index: 1000; display: flex; gap: 20px; align-items: center;
      user-select: none; transition: opacity 0.4s ease;
    }
    .fb-controls.hidden { opacity: 0; pointer-events: none; }
    .fb-ctrl-btn {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.12);
      background: transparent; color: rgba(255,255,255,0.45);
      font-size: 14px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.2s, color 0.2s, border-color 0.2s;
      padding: 0; line-height: 1;
    }
    .fb-ctrl-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.80); border-color: rgba(255,255,255,0.25); }
    .fb-ctrl-btn:active { background: rgba(255,255,255,0.14); }
    .fb-ctrl-btn svg { width: 18px; height: 18px; fill: currentColor; }

    .fb-drawer-overlay {
      position: fixed; inset: 0; z-index: 600;
      background: rgba(0,0,0,0.35); opacity: 0; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .fb-drawer-overlay.open { opacity: 1; pointer-events: auto; }
    .fb-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 300px; max-width: 82vw;
      z-index: 601; background: rgba(8,8,12,0.72);
      border-left: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(32px) saturate(1.4);
      -webkit-backdrop-filter: blur(32px) saturate(1.4);
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
      display: flex; flex-direction: column;
      font-family: 'JetBrains Mono', 'SF Mono', 'Menlo', monospace;
      overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.06) transparent;
    }
    .fb-drawer.open { transform: translateX(0); }
    .fb-drawer-content { padding: 40px 28px 32px; display: flex; flex-direction: column; gap: 36px; }

    .fb-section-title {
      font-size: 10px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase;
      color: rgba(255,255,255,0.25); margin-bottom: 20px; padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .fb-section { display: flex; flex-direction: column; }

    .fb-field-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; margin-bottom: 4px; }
    .fb-field-label { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.40); flex-shrink: 0; letter-spacing: 0.5px; }
    .fb-field-select {
      flex: 1; max-width: 150px; padding: 6px 10px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 6px; color: rgba(255,255,255,0.60);
      font-family: inherit; font-size: 11px; outline: none; cursor: pointer;
    }
    .fb-field-select option { background: #0c0c0e; color: #bbb; }

    .fb-slider-input {
      -webkit-appearance: none; appearance: none; flex: 1; height: 2px;
      background: rgba(255,255,255,0.08); border-radius: 1px; outline: none; cursor: pointer;
    }
    .fb-slider-input::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 12px; height: 12px;
      border-radius: 50%; background: rgba(255,255,255,0.40); cursor: pointer;
    }
    .fb-slider-input::-moz-range-thumb {
      width: 12px; height: 12px; border-radius: 50%;
      background: rgba(255,255,255,0.40); cursor: pointer; border: none;
    }

    .fb-dur-row { display: flex; align-items: center; gap: 8px; min-height: 36px; margin-bottom: 4px; }
    .fb-dur-btn {
      width: 30px; height: 30px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.08); background: transparent;
      color: rgba(255,255,255,0.35); font-size: 16px; font-family: inherit;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; user-select: none; flex-shrink: 0; transition: all 0.15s;
    }
    .fb-dur-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.70); border-color: rgba(255,255,255,0.15); }
    .fb-dur-display {
      width: 56px; padding: 0; background: transparent; border: none;
      color: rgba(255,255,255,0.70); font-family: inherit; font-size: 14px;
      font-weight: 500; letter-spacing: 1.5px; outline: none; text-align: center;
      flex-shrink: 0; caret-color: rgba(255,255,255,0.40);
    }

    .fb-preset-row { display: flex; gap: 6px; margin-bottom: 8px; }
    .fb-preset-btn {
      flex: 1; padding: 4px 0; border: 1px solid transparent; border-radius: 4px;
      background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.28);
      font-size: 11px; font-family: monospace; cursor: pointer; min-height: 26px;
      transition: all 0.2s;
    }
    .fb-preset-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.55); }
    .fb-preset-btn.active {
      border-color: var(--accent, rgba(255,255,255,0.30));
      color: var(--accent, rgba(255,255,255,0.80));
      background: color-mix(in srgb, var(--accent, #fff) 8%, transparent);
      box-shadow: 0 0 6px color-mix(in srgb, var(--accent, #fff) 15%, transparent);
    }

    .fb-theme-strip { display: flex; gap: 0; margin-bottom: 4px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
    .fb-theme-chip {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 10px 0; font-size: 8.5px; font-weight: 500; letter-spacing: 0.8px;
      text-transform: uppercase; font-family: inherit;
      color: rgba(255,255,255,0.30); background: rgba(255,255,255,0.02);
      border: none; border-right: 1px solid rgba(255,255,255,0.04);
      cursor: pointer; transition: all 0.25s;
    }
    .fb-theme-chip:last-child { border-right: none; }
    .fb-theme-chip .fb-led { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; opacity: 0.45; transition: opacity 0.25s, box-shadow 0.25s; }
    .fb-theme-chip:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); }
    .fb-theme-chip:hover .fb-led { opacity: 0.7; }
    .fb-theme-chip.active { color: rgba(255,255,255,0.85); background: color-mix(in srgb, var(--tc) 6%, transparent); box-shadow: inset 0 0 12px color-mix(in srgb, var(--tc) 8%, transparent); }
    .fb-theme-chip.active .fb-led { opacity: 1; box-shadow: 0 0 4px var(--tc), 0 0 8px color-mix(in srgb, var(--tc) 50%, transparent); }

    .fb-toggle-row { display: flex; align-items: center; justify-content: space-between; min-height: 36px; margin-bottom: 4px; }
    .fb-toggle {
      position: relative; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0;
    }
    .fb-toggle input { opacity: 0; width: 0; height: 0; }
    .fb-toggle-track {
      position: absolute; inset: 0; border-radius: 10px;
      background: rgba(255,255,255,0.08); transition: background 0.2s;
    }
    .fb-toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
      border-radius: 50%; background: rgba(255,255,255,0.35);
      transition: transform 0.2s, background 0.2s;
    }
    .fb-toggle input:checked ~ .fb-toggle-track { background: color-mix(in srgb, var(--accent, #fff) 30%, transparent); }
    .fb-toggle input:checked ~ .fb-toggle-thumb { transform: translateX(16px); background: var(--accent, rgba(255,255,255,0.80)); }

    .fb-sys-btn {
      width: 100%; padding: 10px 0; background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;
      color: rgba(255,255,255,0.35); font-family: inherit; font-size: 10px;
      font-weight: 500; letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer; transition: all 0.15s; margin-bottom: 8px;
    }
    .fb-sys-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.60); border-color: rgba(255,255,255,0.10); }

    .fb-credits {
      position: fixed; bottom: 8px; left: 50%; transform: translateX(-50%);
      font-size: 9px; color: rgba(255,255,255,0.12); letter-spacing: 1.5px;
      z-index: 1; pointer-events: none; font-family: 'JetBrains Mono', 'SF Mono', monospace;
      transition: opacity 0.4s ease;
    }
    .fb-credits.hidden { opacity: 0; }
  `;
  document.head.appendChild(style);
}

function makeHold(setter: (d: number) => void) {
  let iv: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return {
    start(d: number) {
      setter(d);
      timeout = setTimeout(() => {
        iv = setInterval(() => setter(d), 80);
      }, 400);
    },
    stop() {
      if (timeout) { clearTimeout(timeout); timeout = null; }
      if (iv) { clearInterval(iv); iv = null; }
    },
  };
}

export function createConsole(
  initialBpm: number,
  initialShape: ShapeType,
  initialPalette: string,
): ConsoleController {
  injectStyles();

  let currentBpm = initialBpm;

  // ── Credits ──
  const creditsEl = document.createElement('div');
  creditsEl.className = 'fb-credits';
  creditsEl.textContent = 'Crafted by Tipsy Tap Studio';
  document.body.appendChild(creditsEl);

  // ── On-screen controls ──
  const controls = document.createElement('div');
  controls.className = 'fb-controls';

  function makeBtn(svg: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'fb-ctrl-btn';
    btn.innerHTML = svg;
    btn.title = title;
    return btn;
  }

  const startBtn = makeBtn('<svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>', 'Start');
  const pauseBtn = makeBtn('<svg viewBox="0 0 24 24"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>', 'Pause');
  const stopBtn = makeBtn('<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>', 'Stop');
  const settingsBtn = makeBtn('<svg viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>', 'Settings');

  startBtn.addEventListener('click', () => ctrl.onStart?.());
  pauseBtn.addEventListener('click', () => ctrl.onPause?.());
  stopBtn.addEventListener('click', () => ctrl.onStop?.());
  settingsBtn.addEventListener('click', () => toggleDrawer());

  controls.appendChild(startBtn);
  controls.appendChild(pauseBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(settingsBtn);
  document.body.appendChild(controls);

  // ── Drawer ──
  const overlay = document.createElement('div');
  overlay.className = 'fb-drawer-overlay';
  overlay.addEventListener('click', () => closeDrawer());

  const drawer = document.createElement('div');
  drawer.className = 'fb-drawer';
  const drawerContent = document.createElement('div');
  drawerContent.className = 'fb-drawer-content';

  // ── Logo ──
  const logoSection = document.createElement('div');
  logoSection.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
  logoSection.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" style="flex-shrink:0">
      <rect width="32" height="32" rx="6" fill="#0a0a0f"/>
      <polygon points="16,4 28,22 4,22" fill="none" stroke="#ff00ff" stroke-width="2"/>
      <polygon points="16,8 24,20 8,20" fill="none" stroke="#00ffff" stroke-width="1.5"/>
    </svg>
    <span style="font-size:14px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.70)">FRACTAL-BEAT</span>
  `;
  drawerContent.appendChild(logoSection);

  // ── TEMPO section ──
  const tempoSection = document.createElement('div');
  tempoSection.className = 'fb-section';
  tempoSection.innerHTML = '<div class="fb-section-title">Tempo</div>';

  // Mode select (BPM / Clock)
  const modeRow = document.createElement('div');
  modeRow.className = 'fb-field-row';
  modeRow.innerHTML = '<span class="fb-field-label">Mode</span>';
  const modeSelect = document.createElement('select');
  modeSelect.className = 'fb-field-select';
  for (const [val, label] of [['bpm', 'BPM Sync'], ['clock', 'Clock (1Hz)']] as const) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    modeSelect.appendChild(opt);
  }
  modeSelect.addEventListener('change', () => {
    const mode = modeSelect.value as 'bpm' | 'clock';
    ctrl.onModeChange?.(mode);
    bpmContainer.style.display = mode === 'bpm' ? '' : 'none';
  });
  modeRow.appendChild(modeSelect);
  tempoSection.appendChild(modeRow);

  // BPM controls container
  const bpmContainer = document.createElement('div');

  // BPM label
  const bpmLabel = document.createElement('div');
  bpmLabel.className = 'fb-field-row';
  bpmLabel.innerHTML = '<span class="fb-field-label">BPM</span>';
  bpmLabel.style.marginBottom = '0';

  // BPM presets
  const bpmPresetRow = document.createElement('div');
  bpmPresetRow.className = 'fb-preset-row';
  const BPM_PRESETS = [
    { label: '60', val: 60 },
    { label: '90', val: 90 },
    { label: '120', val: 120 },
    { label: '140', val: 140 },
    { label: '160', val: 160 },
  ];
  const bpmPresetBtns: HTMLButtonElement[] = [];
  for (const p of BPM_PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'fb-preset-btn';
    btn.textContent = p.label;
    if (p.val === currentBpm) btn.classList.add('active');
    btn.addEventListener('click', () => {
      setBpmVal(p.val);
      bpmPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    bpmPresetRow.appendChild(btn);
    bpmPresetBtns.push(btn);
  }

  // BPM slider row
  const bpmRow = document.createElement('div');
  bpmRow.className = 'fb-dur-row';
  const bpmMinusBtn = document.createElement('button');
  bpmMinusBtn.className = 'fb-dur-btn';
  bpmMinusBtn.textContent = '\u2212';
  const bpmSlider = document.createElement('input');
  bpmSlider.type = 'range';
  bpmSlider.className = 'fb-slider-input';
  bpmSlider.min = '20';
  bpmSlider.max = '300';
  bpmSlider.step = '1';
  bpmSlider.value = String(currentBpm);
  bpmSlider.style.flex = '1';
  const bpmDisplay = document.createElement('input');
  bpmDisplay.className = 'fb-dur-display';
  bpmDisplay.type = 'text';
  bpmDisplay.value = String(currentBpm);
  const bpmPlusBtn = document.createElement('button');
  bpmPlusBtn.className = 'fb-dur-btn';
  bpmPlusBtn.textContent = '+';

  function setBpmVal(v: number): void {
    v = Math.max(20, Math.min(300, v));
    currentBpm = v;
    bpmSlider.value = String(v);
    bpmDisplay.value = String(v);
    ctrl.onBpmChange?.(v);
  }

  bpmSlider.addEventListener('input', () => {
    const v = parseInt(bpmSlider.value, 10);
    currentBpm = v;
    bpmDisplay.value = String(v);
    bpmPresetBtns.forEach(b => b.classList.remove('active'));
    ctrl.onBpmChange?.(v);
  });
  bpmDisplay.addEventListener('change', () => {
    const v = parseInt(bpmDisplay.value, 10);
    if (Number.isFinite(v)) setBpmVal(v);
    else bpmDisplay.value = String(currentBpm);
  });

  const bpmHold = makeHold((d) => setBpmVal(currentBpm + d));
  bpmMinusBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); bpmHold.start(-1); });
  bpmMinusBtn.addEventListener('pointerup', () => bpmHold.stop());
  bpmMinusBtn.addEventListener('pointerleave', () => bpmHold.stop());
  bpmPlusBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); bpmHold.start(1); });
  bpmPlusBtn.addEventListener('pointerup', () => bpmHold.stop());
  bpmPlusBtn.addEventListener('pointerleave', () => bpmHold.stop());

  bpmRow.appendChild(bpmMinusBtn);
  bpmRow.appendChild(bpmSlider);
  bpmRow.appendChild(bpmDisplay);
  bpmRow.appendChild(bpmPlusBtn);

  bpmContainer.appendChild(bpmLabel);
  bpmContainer.appendChild(bpmPresetRow);
  bpmContainer.appendChild(bpmRow);
  tempoSection.appendChild(bpmContainer);

  drawerContent.appendChild(tempoSection);

  // ── VISUAL section ──
  const visualSection = document.createElement('div');
  visualSection.className = 'fb-section';
  visualSection.innerHTML = '<div class="fb-section-title">Visual</div>';

  // Shape select
  const shapeRow = document.createElement('div');
  shapeRow.className = 'fb-field-row';
  shapeRow.innerHTML = '<span class="fb-field-label">Shape</span>';
  const shapeSelect = document.createElement('select');
  shapeSelect.className = 'fb-field-select';
  for (const [val, label] of [['triangle', 'Triangle'], ['square', 'Square'], ['hexagon', 'Hexagon']] as const) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (val === initialShape) opt.selected = true;
    shapeSelect.appendChild(opt);
  }
  shapeSelect.addEventListener('change', () => {
    ctrl.onShapeChange?.(shapeSelect.value as ShapeType);
  });
  shapeRow.appendChild(shapeSelect);
  visualSection.appendChild(shapeRow);

  // Metronome toggle
  const metRow = document.createElement('div');
  metRow.className = 'fb-toggle-row';
  const metLabel = document.createElement('span');
  metLabel.className = 'fb-field-label';
  metLabel.textContent = 'Metronome';
  metRow.appendChild(metLabel);

  const metToggle = document.createElement('label');
  metToggle.className = 'fb-toggle';
  const metCheck = document.createElement('input');
  metCheck.type = 'checkbox';
  metCheck.checked = false;
  const metTrack = document.createElement('span');
  metTrack.className = 'fb-toggle-track';
  const metThumb = document.createElement('span');
  metThumb.className = 'fb-toggle-thumb';
  metToggle.appendChild(metCheck);
  metToggle.appendChild(metTrack);
  metToggle.appendChild(metThumb);
  metRow.appendChild(metToggle);
  visualSection.appendChild(metRow);

  metCheck.addEventListener('change', () => {
    ctrl.onMetronomeChange?.(metCheck.checked);
  });

  drawerContent.appendChild(visualSection);

  // ── PALETTE section ──
  const paletteSection = document.createElement('div');
  paletteSection.className = 'fb-section';
  paletteSection.innerHTML = '<div class="fb-section-title">Palette</div>';

  const themeStrip = document.createElement('div');
  themeStrip.className = 'fb-theme-strip';
  const themeChips: HTMLButtonElement[] = [];

  for (const p of PALETTES) {
    const chip = document.createElement('button');
    chip.className = 'fb-theme-chip';
    const tc = '#' + p.accent.toString(16).padStart(6, '0');
    chip.style.setProperty('--tc', tc);
    if (p.name.toLowerCase() === initialPalette.toLowerCase()) chip.classList.add('active');

    const led = document.createElement('span');
    led.className = 'fb-led';
    led.style.background = tc;
    chip.appendChild(led);
    const label = document.createElement('span');
    label.textContent = p.name;
    chip.appendChild(label);

    chip.addEventListener('click', () => {
      themeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      ctrl.onPaletteChange?.(p.name);
    });
    themeStrip.appendChild(chip);
    themeChips.push(chip);
  }
  paletteSection.appendChild(themeStrip);
  drawerContent.appendChild(paletteSection);

  // ── SYSTEM section ──
  const sysSection = document.createElement('div');
  sysSection.className = 'fb-section';
  sysSection.innerHTML = '<div class="fb-section-title">System</div>';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'fb-sys-btn';
  resetBtn.textContent = 'Reset to Default';
  resetBtn.addEventListener('click', () => ctrl.onResetDefaults?.());
  sysSection.appendChild(resetBtn);

  drawerContent.appendChild(sysSection);

  drawer.appendChild(drawerContent);
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  // ── Drawer toggle ──
  let drawerOpen = false;
  function toggleDrawer(): void {
    drawerOpen = !drawerOpen;
    drawer.classList.toggle('open', drawerOpen);
    overlay.classList.toggle('open', drawerOpen);
  }
  function closeDrawer(): void {
    drawerOpen = false;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }

  // ── Auto-hide UI (5 seconds, only when enabled) ──
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let uiVisible = true;
  let autoHideEnabled = false;

  function showUI(): void {
    if (!uiVisible) {
      uiVisible = true;
      controls.classList.remove('hidden');
      creditsEl.classList.remove('hidden');
    }
    if (autoHideEnabled) resetHideTimer();
  }

  function hideUI(): void {
    if (drawerOpen || !autoHideEnabled) return;
    uiVisible = false;
    controls.classList.add('hidden');
    creditsEl.classList.add('hidden');
  }

  function resetHideTimer(): void {
    if (hideTimeout) clearTimeout(hideTimeout);
    if (autoHideEnabled) {
      hideTimeout = setTimeout(hideUI, 5000);
    }
  }

  function clearHideTimer(): void {
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
  }

  document.addEventListener('mousemove', showUI);
  document.addEventListener('touchstart', showUI);

  // ── Controller ──
  const ctrl: ConsoleController = {
    el: controls,
    show() { controls.classList.remove('hidden'); creditsEl.classList.remove('hidden'); },
    hide() { controls.classList.add('hidden'); creditsEl.classList.add('hidden'); if (drawerOpen) closeDrawer(); },
    onStart: null, onPause: null, onStop: null,
    onBpmChange: null, onShapeChange: null, onMetronomeChange: null,
    onPaletteChange: null, onModeChange: null, onResetDefaults: null,
    setPaused(p: boolean) {
      startBtn.style.display = p ? '' : 'none';
      pauseBtn.style.display = p ? 'none' : '';
    },
    setAccentColor(rgb: [number, number, number]) {
      const [r, g, b] = rgb;
      const accentBorder = `rgba(${r},${g},${b},0.30)`;
      const accentColor = `rgba(${r},${g},${b},0.70)`;
      for (const btn of [startBtn, pauseBtn, stopBtn, settingsBtn]) {
        btn.style.borderColor = accentBorder;
        btn.style.color = accentColor;
      }
      drawer.style.setProperty('--accent', `rgb(${r},${g},${b})`);
      const titles = drawer.querySelectorAll<HTMLElement>('.fb-section-title');
      for (const t of titles) t.style.color = `rgba(${r},${g},${b},0.35)`;
    },
    setBpm(bpm: number) {
      currentBpm = bpm;
      bpmSlider.value = String(bpm);
      bpmDisplay.value = String(bpm);
    },
    setAutoHide(enabled: boolean) {
      autoHideEnabled = enabled;
      if (enabled) {
        resetHideTimer();
      } else {
        clearHideTimer();
        showUI();
      }
    },
    closeDrawer,
  };

  // Initially show pause hidden (idle state shows start)
  pauseBtn.style.display = 'none';
  startBtn.style.display = '';
  return ctrl;
}
