export function parseMemo(memo: string): {
  firstLine: string;
  restLines: string[];
  hasRest: boolean;
} {
  const normalized = (memo || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const firstLine = lines[0] || '';
  const restLines = lines.slice(1);
  const hasRest = restLines.some((l) => l.trim().length > 0);
  return { firstLine, restLines, hasRest };
}

/**
 * テキストエリアの高さを内容（折り返し含む）に合わせて自動調整する。
 * モバイル等の狭幅で1行メモが複数行に自動折り返し（soft wrap）された場合でも、
 * 1行目（先頭）がスクロールアウトせず全文または十分な行数が見えるようにする。
 */
export function fitMemoTextareaHeight(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto';
  const scrollHeight = textarea.scrollHeight;
  if (scrollHeight > 0) {
    textarea.style.height = `${scrollHeight}px`;
  }
}

/**
 * メモ編集開始時にフォーカスを当て、カーソルとスクロール位置を先頭（1行目）に初期化する。
 * カーソルを末尾に置くと、モバイル幅で折り返しが発生した際にブラウザが末尾へスクロールし、
 * 1行目（見出し・時刻）が表示範囲外に隠れてしまう問題を防止する。
 */
export function initializeMemoTextareaView(textarea: HTMLTextAreaElement): void {
  fitMemoTextareaHeight(textarea);
  textarea.focus();
  textarea.setSelectionRange(0, 0);
  textarea.scrollTop = 0;
}
