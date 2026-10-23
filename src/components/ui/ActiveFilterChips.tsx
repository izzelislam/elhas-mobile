import React from 'react';
import {Pressable, ScrollView, Text} from 'react-native';
import {X} from 'lucide-react-native';
import {colors} from '@/theme';

export type FilterChip = {key: string; label: string; onRemove: () => void};

/** Baris chip filter yang sedang aktif; ketuk chip untuk menghapus filter tersebut. */
export function ActiveFilterChips({chips}: {chips: FilterChip[]}) {
  if (!chips.length) {
    return null;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-surface"
      contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 12, gap: 8}}
    >
      {chips.map(c => (
        <Pressable
          key={c.key}
          onPress={c.onRemove}
          className="h-8 flex-row items-center rounded-full bg-brand-light px-3 active:opacity-70"
        >
          <Text
            className="text-caption font-medium text-brand"
            numberOfLines={1}
          >
            {c.label}
          </Text>
          <X size={14} color={colors.brand.DEFAULT} style={{marginLeft: 6}} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
