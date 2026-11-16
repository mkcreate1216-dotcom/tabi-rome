import type { Day } from './types';

/**
 * 空のDayオブジェクトを生成
 */
export function createDefaultDay(name: string): Day {
  return {
    name,
    spots: [],
    accommodation: '',
    accommodationMemo: '',
    autoAccommodation: false,
    autoStart: true,
    autoStartSlot: false,
    autoStartValue: '',
  };
}

/**
 * 指定した日程に宿泊地を設定可能かどうかを判定する。
 * 最終日（帰着日）に到着地点が設定されている場合は宿泊地を置かない仕様。
 */
export function canSetAccommodationOnDay(
  daysLength: number,
  dayIndex: number,
  arrival = '',
  hasArrival = false
): boolean {
  if (dayIndex < 0 || dayIndex >= daysLength) return false;
  const isFinalDay = dayIndex === daysLength - 1;
  const arrivalConfigured = Boolean((arrival || '').trim()) || hasArrival;
  if (isFinalDay && arrivalConfigured) {
    return false;
  }
  return true;
}

/**
 * 前日の宿泊地を翌日の先頭スポット（出発地点）および自動宿泊地へ同期する純関数。
 * 翌日の先頭スポットがユーザーによって手動変更されていた場合は、連動（autoStart）を解除する。
 */
export function syncAutoStarts(days: Day[]): Day[] {
  for (let i = 1; i < days.length; i++) {
    const previousAccommodation = (days[i - 1].accommodation || '').trim();
    const day = days[i];
    if (day.autoAccommodation) {
      day.accommodation = previousAccommodation;
      day.hasAccommodation = Boolean(previousAccommodation);
    }
    if (day.autoStart) {
      if (previousAccommodation) {
        if (day.autoStartSlot) {
          if (day.spots.length === 0) {
            day.spots.unshift({ name: previousAccommodation, memo: '' });
            day.autoStartSlot = true;
            day.autoStartValue = previousAccommodation;
          } else {
            const currentFirst = (day.spots[0]?.name || '').trim();
            const managedValue = (day.autoStartValue || '').trim();
            if (managedValue && currentFirst !== managedValue) {
              day.autoStart = false;
              day.autoStartSlot = false;
              day.autoStartValue = '';
            } else if (!managedValue && currentFirst) {
              day.autoStart = false;
              day.autoStartSlot = false;
              day.autoStartValue = '';
            } else {
              day.spots[0] = { name: previousAccommodation, memo: day.spots[0]?.memo || '' };
              day.autoStartValue = previousAccommodation;
            }
          }
        } else {
          day.spots.unshift({ name: previousAccommodation, memo: '' });
          day.autoStartSlot = true;
          day.autoStartValue = previousAccommodation;
        }
      } else {
        const managedValue = (day.autoStartValue || '').trim();
        if (
          day.autoStartSlot &&
          day.spots.length > 0 &&
          ((day.spots[0]?.name || '').trim() === managedValue || !managedValue)
        ) {
          day.spots.shift();
        }
        day.autoStartSlot = false;
        day.autoStartValue = '';
      }
    }
  }
  return days;
}

/**
 * 指定した日程に宿泊地を設定し、翌日の出発地点（先頭スポット）へ連動させる。
 * 最終日かつ到着地点ありの場合は設定せず false を返す。
 */
export function applyAccommodation(
  days: Day[],
  dayIndex: number,
  name: string,
  memo = '',
  options?: { arrival?: string; hasArrival?: boolean }
): boolean {
  if (
    !canSetAccommodationOnDay(
      days.length,
      dayIndex,
      options?.arrival || '',
      Boolean(options?.hasArrival)
    )
  ) {
    return false;
  }

  const day = days[dayIndex];
  if (!day) return false;

  const trimmedName = (name || '').trim();
  day.accommodation = trimmedName;
  day.accommodationMemo = memo;
  day.hasAccommodation = Boolean(trimmedName);
  day.autoAccommodation = false;

  const nextDay = days[dayIndex + 1];
  if (nextDay) {
    nextDay.autoAccommodation = false;
  }

  syncAutoStarts(days);
  return true;
}
