import React from 'react';
import {Text, View} from 'react-native';

export const capacityColor = (count: number, cap: number) =>
  cap > 0 && count >= cap ? '#DC2626' : cap > 0 && count / cap >= 0.75 ? '#D97706' : '#059669';

/** Bar keterisian: `count` terisi dari `cap` kapasitas. */
export function CapacityBar({count, cap, label}: {count: number; cap: number; label?: string}) {
  const c = capacityColor(count, cap);
  const pct = cap > 0 ? Math.min(100, (count / cap) * 100) : 0;
  return (
    <View>
      <View className="mb-1 flex-row items-baseline justify-between">
        <Text className="text-caption text-ink-muted">{label ?? 'Terisi'}</Text>
        <Text style={{color: c}} className="text-label font-semibold">
          {count} / {cap}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-field">
        <View style={{width: `${pct}%`, backgroundColor: c}} className="h-full rounded-full" />
      </View>
    </View>
  );
}

export const genderLabel = (g?: 'L' | 'P') => (g === 'L' ? 'Putra' : g === 'P' ? 'Putri' : '-');
