import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMemo,
  fitMemoTextareaHeight,
  initializeMemoTextareaView,
} from '../src/scripts/memo.ts';

describe('メモ解析・編集テキストエリア初期表示制御 (memo.ts)', () => {
  it('parseMemo: 1行目と2行目以降を正しく分離し、hasRestを判定する', () => {
    const singleLine = '2027年1月30日（土）・2名 / 09:00頃発 新幹線のぞみ（おすすめ時刻）→ 10:40頃 名古屋駅着';
    const parsedSingle = parseMemo(singleLine);
    assert.equal(parsedSingle.firstLine, singleLine);
    assert.deepEqual(parsedSingle.restLines, []);
    assert.equal(parsedSingle.hasRest, false);

    const multiLine = '10:00〜 浅草寺\n仲見世通りで食べ歩き\n御朱印帳を持参';
    const parsedMulti = parseMemo(multiLine);
    assert.equal(parsedMulti.firstLine, '10:00〜 浅草寺');
    assert.deepEqual(parsedMulti.restLines, ['仲見世通りで食べ歩き', '御朱印帳を持参']);
    assert.equal(parsedMulti.hasRest, true);
  });

  it('fitMemoTextareaHeight: 折り返しを含むscrollHeightに合わせてテキストエリアの高さを自動調整する', () => {
    const mockTextarea = {
      style: { height: '' },
      scrollHeight: 96,
    };

    fitMemoTextareaHeight(mockTextarea);
    assert.equal(mockTextarea.style.height, '96px');
  });

  it('initializeMemoTextareaView: メモ編集開始時に高さを自動調整し、カーソルとスクロール位置を先頭（1行目）に初期化する', () => {
    let focused = false;
    const mockTextarea = {
      value: '2027年1月30日（土）・2名 / 09:00頃発 新幹線のぞみ（おすすめ時刻）→ 10:40頃 名古屋駅着',
      style: { height: '' },
      scrollHeight: 88,
      scrollTop: 48,
      selectionStart: 50,
      selectionEnd: 50,
      focus() {
        focused = true;
      },
      setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      },
    };

    initializeMemoTextareaView(mockTextarea);

    assert.equal(focused, true);
    assert.equal(mockTextarea.style.height, '88px');
    assert.equal(mockTextarea.selectionStart, 0);
    assert.equal(mockTextarea.selectionEnd, 0);
    assert.equal(mockTextarea.scrollTop, 0);
  });
});
