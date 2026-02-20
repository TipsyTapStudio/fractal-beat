# PRD: FRACTAL-BEAT

## 1. Project Overview
- **Project Name**: FRACTAL-BEAT
- **Repository**: https://github.com/TipsyTapStudio/fractal-beat.git
- **Developer**: Tipsy Tap Studio
- **Description**: BPM（Beats Per Minute）やシステムクロックに同期して、ネオンカラーの幾何学的フレームが無限に迫りくる没入型ブラウザ・ビジュアライザー。ミニマル・テクノのストイックな質感とサイバーパンクな美学を融合させる。

## 2. Core Features (MVP)
### 2.1 Geometric Tunnel Zoom
- 正多角形（三角形、四角形、六角形）のワイヤーフレームを 3D 空間に配置。
- ユーザーに向かってズームし、画面手前に達したら消滅（または奥へリサイクル）する無限トンネル構造。
- BPM に同期した「打ち出し」感のあるアニメーション。

### 2.2 BPM & Time Synchronization
- **BPM Sync**: 指定した BPM に基づき、新シェイプの生成間隔とズーム速度を同期。
- **Beat Kick**: 各ビートの瞬間に、スケールや発光強度がわずかに強調されるイージングを実装。
- **Clock Mode**: システムの秒針（1Hz）に合わせて動作するモード。
- **Metronome**: `Web Audio API` を使用したサイン波によるクリック音（ON/OFF切り替え）。

### 2.3 Visual Aesthetics
- **Neon Glow**: `Three.js` の `UnrealBloomPass` を使用した発光エフェクト。
- **Color Palettes**: Cyberpunk Pink/Blue, Acid Green 等のプリセット。

## 3. UI/UX Specifications (Consistency)
- **Design Heritage**: 設定パネル、再生/停止ボタン、全体のレイアウトおよび操作感については、既存プロジェクトの **"Galton Timer"** や **"Galton Tempo"** の設計思想を強く踏襲すること。
- **Overlay UI**: 画面端（右上など）にコンパクトな設定パネルを配置。
    - 項目: BPM入力、再生/一時停止、形状切り替え、サウンドON/OFF、カラー選択。
- **Minimalist Design**: ビジュアライザーの没入感を損なわないよう、UIは半透明または控えめなデザインとする。

## 4. Technical Stack
- **Core**: TypeScript + Vite
- **3D Engine**: Three.js (r160+)
- **Post-processing**: EffectComposer, UnrealBloomPass
- **Audio**: Web Audio API (OscillatorNode)
- **Deployment**: GitHub Pages (via GitHub Actions)

## 5. Implementation Details (Logic)
- **Object Management**: パフォーマンス維持のため、オブジェクトを配列で管理し、再利用（Object Pooling）するロジックを実装せよ。
- **Timing Engine**: `requestAnimationFrame` 内で `clock.getDelta()` を使用し、フレームレートに依存しない正確なビート制御を行え。
- **Responsive**: ウィンドウのリサイズ時にアスペクト比を維持し、全画面描画を継続せよ。

## 6. Development Roadmap
1. **Phase 1**: Vite + Three.js の環境構築と "Galton" スタイルの基本UIの配置。
2. **Phase 2**: 幾何学オブジェクトのループ描画と BPM 同期ロジックの実装。
3. **Phase 3**: ポストプロセスによるネオン質感の適用。
4. **Phase 4**: メトロノーム音の実装と GitHub Pages へのデプロイ設定。

## 7. Goal
音が鳴っていなくても、視覚だけでビート（グルーヴ）を感じられ、かつ他の「Tipsy Tap Studio」作品と並べた際に違和感のない操作感を持つツールを完成させる。