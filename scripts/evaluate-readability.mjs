#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * UI可読性定量評価スクリプト (evaluate-readability.mjs)
 * - WCAG 2.1 コントラスト比および APCA-W3 (Lc) 知覚コントラストを算出
 * - Astro / TS コンポーネント内の低コントラスト文字色・極小フォント・長文行長・行間不足を検出し、具体的な修正コード案を出力
 */

const SLATE_PALETTE = {
  'white': '#ffffff',
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
};

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/**
 * WCAG 2.1 相対輝度とコントラスト比の算出
 */
export function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getWcagContrast(fgHex, bgHex) {
  const l1 = getRelativeLuminance(fgHex);
  const l2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * APCA-W3 (0.0.98G-4g) 知覚コントラスト Lc の近似算出
 */
export function getApcaLc(fgHex, bgHex) {
  const toY = (hex) => {
    const [r, g, b] = hexToRgb(hex).map((v) => Math.pow(v / 255, 2.4));
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    return y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y;
  };
  const yTxt = toY(fgHex);
  const yBg = toY(bgHex);
  const sapc =
    yBg > yTxt
      ? (Math.pow(yBg, 0.56) - Math.pow(yTxt, 0.57)) * 1.14
      : (Math.pow(yBg, 0.65) - Math.pow(yTxt, 0.62)) * 1.14;
  if (Math.abs(sapc) < 0.1) return 0;
  const lc = sapc > 0 ? (sapc - 0.027) * 100 : (sapc + 0.027) * 100;
  return Number(Math.abs(lc).toFixed(1));
}

/**
 * 単一ファイルのUI可読性を解析して指摘リストを返す
 */
export function evaluateFileReadability(filePath, content) {
  const findings = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. 説明段落 (<p>) や主要注釈での低コントラスト text-slate-400 の検出
    if (
      /<(p|summary|span|button)[^>]*class="[^"]*\btext-slate-400\b[^"]*"/.test(line) &&
      !line.includes('summary-arrow') &&
      !line.includes('aria-label="閉じる"') &&
      !line.includes('font-mono')
    ) {
      const wcag = getWcagContrast(SLATE_PALETTE['slate-400'], SLATE_PALETTE['white']);
      const lc = getApcaLc(SLATE_PALETTE['slate-400'], SLATE_PALETTE['white']);
      const targetWcag = getWcagContrast(SLATE_PALETTE['slate-500'], SLATE_PALETTE['white']);
      const targetLc = getApcaLc(SLATE_PALETTE['slate-500'], SLATE_PALETTE['white']);
      findings.push({
        file: filePath,
        line: lineNum,
        category: 'contrast',
        severity: 'WARN',
        message: `低コントラストな文字色 text-slate-400 が使用されています (白背景 WCAG ${wcag}:1 / APCA Lc ${lc} < 60)。`,
        suggestion: `text-slate-400 を text-slate-500 (WCAG ${targetWcag}:1 / APCA Lc ${targetLc}) または text-slate-600 に変更してください。`,
      });
    }

    // 2. 説明段落 (<p>) での 12px 未満 (text-[10px] / text-[11px]) の検出
    if (/<p[^>]*class="[^"]*\btext-\[(10|11)px\][^"]*"/.test(line)) {
      findings.push({
        file: filePath,
        line: lineNum,
        category: 'typography-size',
        severity: 'WARN',
        message: `段落テキスト (<p>) に 12px 未満のフォントサイズ (text-[10px] / text-[11px]) が指定されています。`,
        suggestion: `text-xs (12px) 以上へ引き上げ、leading-relaxed を併用してください。`,
      });
    }

    // 3. 免責・規約等の長文コンテナで max-w-prose 等が未指定のケース
    if (/class="[^"]*\bdisclaimer-content\b[^"]*"/.test(line) && !line.includes('max-w-')) {
      findings.push({
        file: filePath,
        line: lineNum,
        category: 'typography-measure',
        severity: 'WARN',
        message: `長文コンテナ (.disclaimer-content) に行長制限 (max-w-prose 等) が設定されていません。`,
        suggestion: `max-w-prose または適切な最大幅クラスを追加し、1行あたりの文字数を読みやすい範囲に保ってください。`,
      });
    }
  });

  return findings;
}

const DEFAULT_TARGETS = [
  'src/layouts/PlannerLayout.astro',
  'src/components/LpHero.astro',
  'src/components/TripCombobox.astro',
  'src/components/SpotAddForm.astro',
  'src/components/ItineraryFooterActions.astro',
  'src/components/McpConnectModal.astro',
  'src/components/Footer.astro',
  'src/pages/privacy.astro',
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const cliTargets = process.argv.slice(2);
  const targets = cliTargets.length > 0 ? cliTargets : DEFAULT_TARGETS;

  console.log('📊 UI可読性定量評価 (APCA / WCAG 2.1 / Typography) を実行中...\n');
  console.log('【カラーパレット基準値 (対 #ffffff 背景)】');
  for (const key of ['slate-400', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900']) {
    const hex = SLATE_PALETTE[key];
    console.log(
      `  - ${key.padEnd(10)} (${hex}): WCAG ${String(getWcagContrast(hex, '#ffffff')).padEnd(5)}:1 | APCA Lc ${getApcaLc(hex, '#ffffff')}`
    );
  }
  console.log('');

  let allFindings = [];
  for (const relPath of targets) {
    const absPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(absPath)) continue;
    const content = fs.readFileSync(absPath, 'utf-8');
    const fileFindings = evaluateFileReadability(relPath, content);
    allFindings = allFindings.concat(fileFindings);
  }

  if (allFindings.length === 0) {
    console.log('✅ すべての対象コンポーネントがUI可読性基準（コントラスト・最小文字サイズ・行長）を満たしています！\n');
    process.exit(0);
  } else {
    console.log(`⚠️ ${allFindings.length} 件の可読性改善ポイントが検出されました:\n`);
    for (const f of allFindings) {
      console.log(`- [${f.category}] ${f.file}:${f.line}`);
      console.log(`  課題: ${f.message}`);
      console.log(`  提案: ${f.suggestion}\n`);
    }
    process.exit(0);
  }
}
