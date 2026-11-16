import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultDay,
  canSetAccommodationOnDay,
  syncAutoStarts,
  applyAccommodation,
} from '../src/scripts/accommodation.ts';
import {
  getSpotSearchUrl,
  getRouteUrl,
  getDayRouteUrl,
  buildRouteUrl,
} from '../src/scripts/maps.ts';

describe('宿泊地連動ロジック (accommodation.ts)', () => {
  it('1日目の宿泊地を設定すると、翌日（2日目）の先頭スポットへ自動反映される', () => {
    const days = [createDefaultDay('Day 1'), createDefaultDay('Day 2')];
    days[1].spots.push({ name: '清水寺', memo: '朝参拝' });

    const applied = applyAccommodation(days, 0, '京都ホテル', 'チェックイン15時');
    assert.equal(applied, true);
    assert.equal(days[0].accommodation, '京都ホテル');
    assert.equal(days[0].accommodationMemo, 'チェックイン15時');

    assert.equal(days[1].spots.length, 2);
    assert.equal(days[1].spots[0].name, '京都ホテル');
    assert.equal(days[1].spots[1].name, '清水寺');
    assert.equal(days[1].autoStartSlot, true);
    assert.equal(days[1].autoStartValue, '京都ホテル');
  });

  it('宿泊地を変更すると、未手動編集の翌日先頭スポットも追従して更新される', () => {
    const days = [createDefaultDay('Day 1'), createDefaultDay('Day 2')];
    applyAccommodation(days, 0, '京都ホテル');
    assert.equal(days[1].spots[0].name, '京都ホテル');

    applyAccommodation(days, 0, '嵐山温泉宿');
    assert.equal(days[1].spots.length, 1);
    assert.equal(days[1].spots[0].name, '嵐山温泉宿');
    assert.equal(days[1].autoStartValue, '嵐山温泉宿');
  });

  it('翌日先頭スポットが手動変更された後は、前日の宿泊地を変更しても連動を切って上書きしない', () => {
    const days = [createDefaultDay('Day 1'), createDefaultDay('Day 2')];
    applyAccommodation(days, 0, '京都ホテル');
    assert.equal(days[1].spots[0].name, '京都ホテル');

    // ユーザーが2日目の先頭スポットを手動変更
    days[1].spots[0].name = '京都駅八条口';
    syncAutoStarts(days);

    assert.equal(days[1].autoStart, false);
    assert.equal(days[1].autoStartSlot, false);
    assert.equal(days[1].autoStartValue, '');

    // 前日の宿泊地を別ホテルに変更しても、2日目の先頭スポットは手動変更後のまま維持される
    applyAccommodation(days, 0, '別のホテル');
    assert.equal(days[1].spots[0].name, '京都駅八条口');
  });

  it('最終日に到着地点が設定されている場合は、最終日に宿泊地を置かない', () => {
    const days = [createDefaultDay('Day 1'), createDefaultDay('Day 2')];
    assert.equal(canSetAccommodationOnDay(days.length, 1, '東京駅'), false);

    const applied = applyAccommodation(days, 1, '最終日ホテル', '', { arrival: '東京駅' });
    assert.equal(applied, false);
    assert.equal(days[1].accommodation, '');
  });

  it('前日の宿泊地が空に戻された場合、自動反映されていた翌日先頭スポットは削除される', () => {
    const days = [createDefaultDay('Day 1'), createDefaultDay('Day 2')];
    days[1].spots.push({ name: '金閣寺', memo: '' });
    applyAccommodation(days, 0, '京都ホテル');
    assert.equal(days[1].spots.length, 2);
    assert.equal(days[1].spots[0].name, '京都ホテル');

    applyAccommodation(days, 0, '');
    assert.equal(days[1].spots.length, 1);
    assert.equal(days[1].spots[0].name, '金閣寺');
    assert.equal(days[1].autoStartSlot, false);
  });
});

describe('マップURL生成ロジック (maps.ts)', () => {
  it('地点数が0件（または空白のみ）のときは空文字を返す', () => {
    assert.equal(buildRouteUrl([], 'google'), '');
    assert.equal(buildRouteUrl(['', '   '], 'apple'), '');
    assert.equal(getDayRouteUrl([], 'google'), '');
    assert.equal(getSpotSearchUrl('   ', 'google'), '');
  });

  it('地点数が1件のときは単一地点の検索URLを返す（Google / Apple）', () => {
    const googleUrl = buildRouteUrl(['浅草寺'], 'google');
    assert.equal(
      googleUrl,
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('浅草寺')}`
    );

    const appleUrl = buildRouteUrl(['浅草寺'], 'apple');
    assert.equal(appleUrl, `https://maps.apple.com/?q=${encodeURIComponent('浅草寺')}`);
  });

  it('地点数が2件のときは出発地と目的地のルートURLを返す（Google / Apple）', () => {
    const googleUrl = buildRouteUrl(['東京駅', '浅草寺'], 'google');
    assert.equal(
      googleUrl,
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent('東京駅')}&destination=${encodeURIComponent('浅草寺')}`
    );
    assert.equal(googleUrl, getRouteUrl('東京駅', '浅草寺', 'google'));

    const appleUrl = buildRouteUrl(['東京駅', '浅草寺'], 'apple');
    assert.equal(
      appleUrl,
      `https://maps.apple.com/?saddr=${encodeURIComponent('東京駅')}&daddr=${encodeURIComponent('浅草寺')}`
    );
    assert.equal(appleUrl, getRouteUrl('東京駅', '浅草寺', 'apple'));
  });

  it('地点数が3件以上のときは経由地（waypoints）を含むルートURLを返す（Google / Apple）', () => {
    const points = ['京都駅', '清水寺', '金閣寺', '嵐山'];
    const googleUrl = buildRouteUrl(points, 'google');
    assert.equal(
      googleUrl,
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent('京都駅')}&destination=${encodeURIComponent('嵐山')}&waypoints=${encodeURIComponent('清水寺')}%7C${encodeURIComponent('金閣寺')}`
    );

    const appleUrl = buildRouteUrl(points, 'apple');
    assert.equal(
      appleUrl,
      `https://maps.apple.com/directions?mode=driving&source=${encodeURIComponent('京都駅')}&waypoint=${encodeURIComponent('清水寺')}&waypoint=${encodeURIComponent('金閣寺')}&destination=${encodeURIComponent('嵐山')}`
    );
  });
});

