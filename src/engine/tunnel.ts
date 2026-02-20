import * as THREE from 'three';

// ── Color Palettes ──
export interface Palette {
  name: string;
  colors: number[];
  accent: number;
}

export const PALETTES: Palette[] = [
  { name: 'Cyberpunk', colors: [0xff00ff, 0x00ffff, 0xff1493, 0x7b68ee], accent: 0xff00ff },
  { name: 'Acid',      colors: [0x00ff41, 0x39ff14, 0xadff2f, 0x7fff00], accent: 0x00ff41 },
  { name: 'Sunset',    colors: [0xff4500, 0xff6347, 0xff8c00, 0xffd700], accent: 0xff4500 },
  { name: 'Frost',     colors: [0x00bfff, 0x87ceeb, 0x4169e1, 0x00ced1], accent: 0x00bfff },
  { name: 'Mono',      colors: [0xffffff, 0xcccccc, 0x999999, 0x666666], accent: 0xffffff },
];

export type ShapeType = 'triangle' | 'square' | 'hexagon';

const POOL_SIZE = 32;
const SPAWN_Z = -50;
const DESPAWN_Z = 2;

interface PoolItem {
  mesh: THREE.LineLoop;
  active: boolean;
  z: number;
  baseScale: number;
  colorIndex: number;
}

function createShapeGeometry(type: ShapeType): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const sides = type === 'triangle' ? 3 : type === 'square' ? 4 : 6;
  const offset = type === 'square' ? Math.PI / 4 : -Math.PI / 2;
  for (let i = 0; i <= sides; i++) {
    const angle = offset + (i * 2 * Math.PI) / sides;
    pts.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export class TunnelEngine {
  private _pool: PoolItem[] = [];
  private _geometries: Record<ShapeType, THREE.BufferGeometry>;
  private _currentShape: ShapeType = 'hexagon';
  private _palette: Palette = PALETTES[0]!;
  private _spawnInterval = 0.5;
  private _zoomSpeed = 25;
  private _timeSinceSpawn = 0;
  private _colorCounter = 0;
  private _scene: THREE.Scene;
  private _kickScale = 1.0;

  constructor(scene: THREE.Scene) {
    this._scene = scene;
    this._geometries = {
      triangle: createShapeGeometry('triangle'),
      square: createShapeGeometry('square'),
      hexagon: createShapeGeometry('hexagon'),
    };
    this._initPool();
    this._updateSpeeds();
    // Spawn first shape immediately
    this._timeSinceSpawn = this._spawnInterval;
  }

  private _initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        toneMapped: false,  // bypass tone mapping so lines stay bright
      });
      const mesh = new THREE.LineLoop(this._geometries[this._currentShape], mat);
      mesh.visible = false;
      mesh.position.set(0, 0, SPAWN_Z);
      this._scene.add(mesh);
      this._pool.push({ mesh, active: false, z: SPAWN_Z, baseScale: 1, colorIndex: 0 });
    }
  }

  setBpm(bpm: number): void {
    this._spawnInterval = 60.0 / bpm;
    this._updateSpeeds();
  }

  setClockMode(): void {
    this._spawnInterval = 1.0;
    this._updateSpeeds();
  }

  private _updateSpeeds(): void {
    const distance = Math.abs(DESPAWN_Z - SPAWN_Z);
    this._zoomSpeed = distance / (this._spawnInterval * 4);
  }

  setShape(type: ShapeType): void {
    this._currentShape = type;
    const geo = this._geometries[type];
    for (const item of this._pool) {
      item.mesh.geometry = geo;
    }
  }

  setPalette(palette: Palette): void {
    this._palette = palette;
  }

  applyBeatKick(): void {
    this._kickScale = 1.15;
  }

  reset(): void {
    this._timeSinceSpawn = 0;
    this._colorCounter = 0;
    this._kickScale = 1.0;
    for (const item of this._pool) {
      item.active = false;
      item.mesh.visible = false;
      item.z = SPAWN_Z;
      item.mesh.position.z = SPAWN_Z;
    }
  }

  update(dt: number): void {
    // Decay kick scale
    if (this._kickScale > 1.0) {
      this._kickScale = Math.max(1.0, this._kickScale - dt * 3.0);
    }

    // Spawn logic
    this._timeSinceSpawn += dt;
    if (this._timeSinceSpawn >= this._spawnInterval) {
      this._timeSinceSpawn -= this._spawnInterval;
      this._spawn();
    }

    // Update active shapes
    for (const item of this._pool) {
      if (!item.active) continue;

      item.z += this._zoomSpeed * dt;
      item.mesh.position.z = item.z;

      // t: 0 at spawn, 1 at despawn
      const t = (item.z - SPAWN_Z) / (DESPAWN_Z - SPAWN_Z);
      const baseScale = 0.5 + t * 5.0;
      item.baseScale = baseScale;
      const finalScale = baseScale * this._kickScale;
      item.mesh.scale.set(finalScale, finalScale, 1);

      // Opacity: fade in quickly, full mid, fade out near camera
      const opacity = t < 0.05 ? t / 0.05 : t > 0.92 ? 1.0 - (t - 0.92) / 0.08 : 1.0;
      const mat = item.mesh.material as THREE.LineBasicMaterial;
      mat.opacity = opacity;

      // Recycle
      if (item.z >= DESPAWN_Z) {
        item.active = false;
        item.mesh.visible = false;
      }
    }
  }

  private _spawn(): void {
    const item = this._pool.find(p => !p.active);
    if (!item) return;

    item.active = true;
    item.z = SPAWN_Z;
    item.mesh.position.set(0, 0, SPAWN_Z);
    item.mesh.visible = true;
    item.mesh.scale.set(0.5, 0.5, 1);

    // Cycle colors
    const colors = this._palette.colors;
    const colorHex = colors[this._colorCounter % colors.length]!;
    item.colorIndex = this._colorCounter % colors.length;
    this._colorCounter++;

    const mat = item.mesh.material as THREE.LineBasicMaterial;
    mat.color.setHex(colorHex);
    mat.opacity = 0;

    // Slight random rotation for variety
    item.mesh.rotation.z = Math.random() * Math.PI * 0.1 - Math.PI * 0.05;
  }
}
