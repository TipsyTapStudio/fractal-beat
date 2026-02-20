export interface TimingState {
  beatIndex: number;
  phase: number;
  isNewBeat: boolean;
}

export class TimingEngine {
  private _bpm = 120;
  private _clockMode = false;
  private _elapsed = 0;
  private _lastBeatIndex = -1;

  get bpm(): number { return this._bpm; }
  get interval(): number {
    return this._clockMode ? 1.0 : 60.0 / this._bpm;
  }

  setBpm(bpm: number): void {
    this._bpm = Math.max(20, Math.min(300, bpm));
  }

  setClockMode(on: boolean): void {
    this._clockMode = on;
  }

  reset(): void {
    this._elapsed = 0;
    this._lastBeatIndex = -1;
  }

  update(dt: number): TimingState {
    this._elapsed += dt;

    const interval = this.interval;
    const beatIndex = Math.floor(this._elapsed / interval);
    const phase = (this._elapsed % interval) / interval;
    const isNewBeat = beatIndex !== this._lastBeatIndex;
    this._lastBeatIndex = beatIndex;

    return { beatIndex, phase, isNewBeat };
  }
}
