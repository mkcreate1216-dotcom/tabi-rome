# UI可読性定量評価・改善レポート

本ドキュメントは、`.agents/skills/ui-readability-evaluator/SKILL.md` および `scripts/evaluate-readability.mjs` を用いて、主要画面・コンポーネントの可読性を定量判定し、改善を実施した結果をまとめたものです。

---

## 1. 定量評価基準（カラーコントラスト実測値）

白背景（`#ffffff`）および薄灰背景（`#f1f5f9`）に対する Tailwind Slate カラーパレットの WCAG 2.1 コントラスト比および APCA 知覚コントラスト（$L^c$）は以下の通りです。

| クラス | カラーコード | 対 `#ffffff` WCAG比 | 対 `#ffffff` APCA $L^c$ | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| `text-slate-400` | `#94a3b8` | `2.56:1` | `50.2` | ❌ 説明文・注釈にはコントラスト不足（WCAG AA 4.5:1 未満） |
| `text-slate-500` | `#64748b` | `4.76:1` | `73.0` | ✅ 補助テキスト・注釈で WCAG AA 基準クリア |
| `text-slate-600` | `#475569` | `7.58:1` | `86.3` | ✅ 本文・ピル内テキストで WCAG AAA / APCA 基準クリア |
| `text-slate-700` | `#334155` | `10.35:1` | `94.0` | ✅ 主要ラベル・手順テキストとして高視認性 |
| `text-slate-900` | `#0f172a` | `17.85:1` | `104.6` | ✅ 見出し・強調テキストとして最高視認性 |

---

## 2. 検出された課題と改善内容

| 対象ファイル | 検出された課題（改善前） | 実施した改善（改善後） | 定量効果 |
| :--- | :--- | :--- | :--- |
| `src/components/TripCombobox.astro` | 90日保存期間の案内文が `text-[10px] text-slate-400 leading-snug` | `text-xs text-slate-500 leading-relaxed` に変更 | WCAG `2.56:1` → `4.76:1`、文字サイズ `10px` → `12px` |
| `src/components/SpotAddForm.astro` | `（未選択時はスポット）` 等の補足が `text-[11px] text-slate-400` | `text-xs text-slate-500` に変更 | WCAG `2.56:1` → `4.76:1`、文字サイズ `11px` → `12px` |
| `src/components/ItineraryFooterActions.astro` | 保存期間の案内文が `text-[11px] text-slate-400` | `text-xs text-slate-500 leading-relaxed` に変更 | WCAG `2.56:1` → `4.76:1`、文字サイズ `11px` → `12px` |
| `src/components/McpConnectModal.astro` | 手順番号が `text-[10px]`、再発行ボタンや詳細が `text-slate-400` | 手順本文を `text-xs sm:text-sm text-slate-700 leading-relaxed`、補助リンクを `text-slate-500` に改善 | APCA $L^c$ `50.2` → `73.0〜94.0` |
| `src/layouts/PlannerLayout.astro` | LP下部の静的サンプル例ピル（`#lp-samples-section`）が薄灰背景上で `text-slate-500` | 静的 `<span>`・非クリッカブル仕様を維持したまま `text-slate-600` に変更 | 対 `#f1f5f9` 背景で WCAG `4.21:1` → `6.71:1`（AAクリア） |
| `src/components/Footer.astro` | 免責事項（`.disclaimer-content`）が `text-[11px]` かつ全幅表示 | `max-w-prose mx-auto text-xs leading-relaxed` を適用 | 1行あたり文字数を適正範囲に制限し視線移動負荷を軽減 |
| `src/pages/privacy.astro` | 本文が `text-xs sm:text-sm` かつ行長制限なし | `max-w-prose text-sm sm:text-base leading-relaxed` に改善 | デスクトップで `16px (1rem)`・適正行長を達成 |

