export class AudioEngine {
  private _ctx: AudioContext | null = null;
  private _enabled = false;

  get enabled(): boolean { return this._enabled; }

  setEnabled(on: boolean): void {
    this._enabled = on;
    if (on && !this._ctx) {
      this._ctx = new AudioContext();
    }
  }

  playClick(accent: boolean): void {
    if (!this._enabled || !this._ctx) return;

    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = accent ? 1000 : 800;

    const vol = accent ? 0.5 : 0.3;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}
