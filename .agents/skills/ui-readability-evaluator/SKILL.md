---
name: ui-readability-evaluator
description: >-
  UIコンポーネントやページの可読性・視認性を定量的な指標（APCA Lc / WCAG 2.1 コントラスト比、行長・行間・最小フォントサイズ、マイクロコピー）で判定し、具体的なTailwind CSS / CSS修正案と改善レポートを出力するスキル。UIの新規作成・改修・監査時に適用する。
---

# UI可読性定量評価スキル (ui-readability-evaluator)

## 目的
感覚的な判断に依存しがちなUIテキストの読みやすさを、**APCA (Accessible Perceptual Contrast Algorithm)**・**WCAG 2.1 コントラスト比**・**日本語タイポグラフィ基準**の3軸で定量的に判定し、具体的なクラス修正コード案を伴うフィードバックと改善を一貫して行います。

---

## 判定基準（3つの評価軸）

### 1. 視覚的コントラスト・視認性 (Visual Contrast & Visibility)
- **WCAG 2.1 コントラスト比 & APCA ($L^c$) 基準**:
  - **本文・主要ラベル**: WCAG AA **4.5:1 以上** かつ APCA **$L^c \ge 60 \sim 75$**
    - 白背景 (`#ffffff`) / 薄灰背景 (`#f8fafc`, `#f1f5f9`) に対しては `text-slate-600` (`#475569`, WCAG 6.7〜7.5:1, $L^c \approx 75\sim79$) または `text-slate-700` 以上を推奨。
  - **補助テキスト・注釈**: 最低でも `text-slate-500` (`#64748b`, 白背景で WCAG 4.76:1, $L^c \approx 65.4$) を使用。
  - **禁止パターン**: 意味を持つ説明文・注釈・リンクに `text-slate-400` (`#94a3b8`, 白背景で WCAG 2.54:1, $L^c \approx 45.8$) 以下を使用しない（プレースホルダーや非活性アイコンを除く）。
- **DOMレベルのアクセシビリティ監査 (`axe-core` 相当)**:
  - アイコンのみボタンへの `aria-label` 付与、モーダルの `role="dialog"` / `aria-labelledby`、適切なランドマーク要素の使用。

### 2. タイポグラフィ・レイアウト (Typography & Layout)
- **行長（Measure / 1行あたりの文字数）**:
  - 長文・説明セクション・規約テキストでは1行あたり日本語30〜40文字前後（`max-w-prose` または `max-w-2xl`）に制限し、視線移動の負担を抑える。
- **行間（Leading / `line-height`）**:
  - 2行以上にわたる説明文・注釈には `leading-relaxed` (`1.625`) または `leading-6` 以上を指定し、WCAG基準（1.5倍以上）を満たす。
- **最小フォントサイズ**:
  - 長文本文は `text-sm sm:text-base`（`14px〜16px`）以上。
  - 補足テキスト・注釈でも原則 `text-xs`（`12px`）以上とし、`text-[10px]` / `text-[11px]` の多用を避ける（バッジ等の極小ラベルを除く）。
- **余白と情報のグルーピング**:
  - 見出し・本文・アクション間の余白（`space-y-*`, `gap-*`）を階層化する。

### 3. UIテキスト・マイクロコピー (Microcopy)
- **一文の長さと明快さ**:
  - 1文は60〜80文字以内を目安とし、二重否定（「〜しないと登録できません」等）を避け、肯定形・具体的な次アクションで案内する。

---

## 定量評価スクリプトの実行方法

リポジトリ同梱の定量評価スクリプトを実行すると、任意のファイルまたは全画面コンポーネントに対してコントラスト値（WCAG比・APCA $L^c$）・フォントサイズ・行間・行長を自動検査し、具体的な修正案を出力できます。

```bash
# 全UIコンポーネント・ページを一括評価
npm run check:readability

# 特定のコンポーネントやページを指定して評価
node ./scripts/evaluate-readability.mjs src/components/Footer.astro
```

---

## 出力レポートフォーマット

評価実施時は以下の形式で定量指標と具体的な修正案を提示します：

```markdown
### 📊 UI可読性評価レポート
- **対象**: `<ファイルパス>`
- **コントラスト判定**: `text-slate-400` on `#ffffff` (WCAG `2.54:1` / APCA `Lc 45.8`) ❌ 要改善
  - **修正案**: `text-slate-400` → `text-slate-500` (WCAG `4.76:1` / APCA `Lc 65.4`) または `text-slate-600` (WCAG `7.58:1` / APCA `Lc 79.2`)
- **タイポグラフィ判定**: `text-[11px]` → `text-xs leading-relaxed max-w-prose`
```
