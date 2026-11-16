#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();

const checks = [
  {
    name: 'LPサンプルタグのボタン化・クリッカブル化チェック (index.astro)',
    file: 'src/pages/index.astro',
    validate: (content) => {
      const errors = [];
      if (content.includes('data-sample-trip')) {
        errors.push('data-sample-trip 属性が含まれています。LPの例は非クリッカブルである必要があります。');
      }
      const sampleSectionMatch = content.match(/<div[^>]*id="lp-samples-section"[\s\S]*?<\/div>\s*<\/div>/);
      if (sampleSectionMatch) {
        const section = sampleSectionMatch[0];
        if (section.includes('<button')) {
          errors.push('lp-samples-section 内に <button> タグが含まれています。<span> などの静的タグを使用してください。');
        }
        if (section.includes('cursor-pointer')) {
          errors.push('lp-samples-section 内に cursor-pointer が含まれています。クリック可能に見えるスタイルは禁止です。');
        }
      }
      return errors;
    }
  },
  {
    name: 'LPサンプルタグのボタン化・クリッカブル化チェック (planId.astro)',
    file: 'src/pages/p/[planId].astro',
    validate: (content) => {
      const errors = [];
      if (content.includes('data-sample-trip')) {
        errors.push('data-sample-trip 属性が含まれています。LPの例は非クリッカブルである必要があります。');
      }
      const sampleSectionMatch = content.match(/<div[^>]*id="lp-samples-section"[\s\S]*?<\/div>\s*<\/div>/);
      if (sampleSectionMatch) {
        const section = sampleSectionMatch[0];
        if (section.includes('<button')) {
          errors.push('lp-samples-section 内に <button> タグが含まれています。<span> などの静的タグを使用してください。');
        }
        if (section.includes('cursor-pointer')) {
          errors.push('lp-samples-section 内に cursor-pointer が含まれています。クリック可能に見えるスタイルは禁止です。');
        }
      }
      return errors;
    }
  },
  {
    name: 'スクリプト内のサンプルタグイベントリスナー混入チェック (app.ts)',
    file: 'src/scripts/app.ts',
    validate: (content) => {
      const errors = [];
      if (content.includes('data-sample-trip') || content.includes('sampleTrip')) {
        errors.push('app.ts 内に data-sample-trip / sampleTrip 関連の処理が含まれています。LPの例へのイベントリスナー追加は禁止です。');
      }
      return errors;
    }
  },
  {
    name: '管理画面でのユーザー旅程・IPの非表示チェック (admin/index.astro)',
    file: 'src/pages/admin/index.astro',
    validate: (content) => {
      const errors = [];
      if (/SELECT\s+id,\s*title/i.test(content) || /\bp\.title\b/.test(content)) {
        errors.push('ユーザーの旅程タイトルを管理画面で取得・表示してはなりません。');
      }
      if (/\/p\/\$\{p\.id\}/.test(content) || /\bp\.id\b/.test(content)) {
        errors.push('ユーザーの旅程ID/リンクを管理画面に表示してはなりません。');
      }
      if (/SELECT[^`]*client_ip/i.test(content) || /\bt\.client_ip\b/.test(content)) {
        errors.push('クライアントIPを管理画面で取得・表示してはなりません。');
      }
      if (!/path LIKE '\/p\/%'/.test(content)) {
        errors.push('人気ページの集計で /p/{id} を /p にまとめていません。共有プランIDは表示できません。');
      }
      if (/ADMIN_(?:PASSWORD|KEY)\s*\|\|\s*['"][^'"]+['"]/.test(content)) {
        errors.push('管理画面に既定パスワード（フォールバック文字列）を設定してはなりません。');
      }
      if (!content.includes('isAdminKeyConfigured')) {
        errors.push('環境変数未設定時に管理画面へのログインを拒否するガード (isAdminKeyConfigured) が必要です。');
      }
      return errors;
    }
  },
  {
    name: '広告管理画面での既定パスワード禁止チェック (admin/ads.astro)',
    file: 'src/pages/admin/ads.astro',
    validate: (content) => {
      const errors = [];
      if (/ADMIN_(?:PASSWORD|KEY)\s*\|\|\s*['"][^'"]+['"]/.test(content)) {
        errors.push('広告管理画面に既定パスワード（フォールバック文字列）を設定してはなりません。');
      }
      if (!content.includes('isAdminKeyConfigured')) {
        errors.push('環境変数未設定時に広告管理画面へのアクセスを拒否するガード (isAdminKeyConfigured) が必要です。');
      }
      return errors;
    }
  },
  {
    name: 'アクセス解析での共有プランID保存禁止 (analytics/track.ts)',
    file: 'src/pages/api/analytics/track.ts',
    validate: (content) => {
      const errors = [];
      if (!content.includes('redactAnalyticsPath') || !content.includes('redactAnalyticsReferer')) {
        errors.push('計測パスと参照元は redactAnalyticsPath / redactAnalyticsReferer を通してから保存してください。');
      }
      return errors;
    }
  },
  {
    name: 'ブロック単体検索ボタン・ルート横スポット追加ボタンの実装チェック (app.ts)',
    file: 'src/scripts/app.ts',
    validate: (content) => {
      const errors = [];
      if (!content.includes('data-spot-search-btn')) {
        errors.push('ブロック単体で目的地検索するボタン (data-spot-search-btn) が含まれていません。');
      }
      if (!content.includes('data-insert-spot-btn')) {
        errors.push('ルート検索ボタン横のスポット追加ボタン (data-insert-spot-btn) が含まれていません。');
      }
      return errors;
    }
  },
  {
    name: 'OGPメタタグ出力チェック (Layout.astro)',
    file: 'src/layouts/Layout.astro',
    validate: (content) => {
      const errors = [];
      if (!content.includes('property="og:title"') || !content.includes('property="og:description"')) {
        errors.push('Layout.astro に OGP タグ (og:title / og:description) が設定されていません。');
      }
      return errors;
    }
  },
  {
    name: 'フッターからのプライバシー表記導線チェック (Footer.astro)',
    file: 'src/components/Footer.astro',
    validate: (content) => {
      const errors = [];
      if (!content.includes('href="/privacy"')) {
        errors.push('Footer.astro にプライバシー表記ページ (/privacy) へのリンクがありません。');
      }
      return errors;
    }
  },
  {
    name: 'プライバシー・広告表記ページの必須項目チェック (privacy.astro)',
    file: 'src/pages/privacy.astro',
    validate: (content) => {
      const errors = [];
      if (!content.includes('アクセス解析') || !content.includes('アフィリエイト')) {
        errors.push('privacy.astro に保存データ・アクセス解析・広告（アフィリエイト）の記載が必要です。');
      }
      return errors;
    }
  },
  {
    name: 'robots.txt エンドポイント存在チェック (robots.txt.ts)',
    file: 'src/pages/robots.txt.ts',
    validate: (content) => {
      const errors = [];
      if (!content.includes('Sitemap:')) {
        errors.push('robots.txt.ts に Sitemap の記載がありません。');
      }
      return errors;
    }
  },
  {
    name: 'sitemap.xml エンドポイント存在チェック (sitemap.xml.ts)',
    file: 'src/pages/sitemap.xml.ts',
    validate: (content) => {
      const errors = [];
      if (!content.includes('<urlset')) {
        errors.push('sitemap.xml.ts に <urlset> の出力がありません。');
      }
      return errors;
    }
  }
];

let hasErrors = false;

console.log('🔍 仕様ガードチェックを実行中...');

for (const check of checks) {
  const filePath = path.join(rootDir, check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ファイルが存在しません: ${check.file}`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = check.validate(content);

  if (errors.length > 0) {
    console.error(`❌ [仕様違反検知] ${check.name}:`);
    for (const err of errors) {
      console.error(`   - ${err}`);
    }
    hasErrors = true;
  } else {
    console.log(`✅ [合格] ${check.name}`);
  }
}

if (hasErrors) {
  console.error('\n🚨 仕様ガードチェックに失敗しました。AGENTS.mdの「LPのサンプル表示（「例:」タグ）に関する絶対禁止事項」を確認してください。\n');
  process.exit(1);
} else {
  console.log('\n✨ すべての仕様ガードチェックに合格しました。\n');
}
