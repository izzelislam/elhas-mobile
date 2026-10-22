import React from 'react';
import {Pressable, Text, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {colors, TintName} from '@/theme';

type Props = {
  label: string;
  icon: LucideIcon;
  tint: TintName;
  onPress?: () => void;
};

export function MenuTile({label, icon: Icon, tint, onPress}: Props) {
  const {bg, fg} = colors.tint[tint];
  return (
    <Pressable onPress={onPress} className="w-1/4 items-center py-3 active:opacity-70">
      <View
        style={{backgroundColor: bg}}
        className="h-14 w-14 items-center justify-center rounded-icon">
        <Icon size={26} color={fg} strokeWidth={1.8} />
      </View>
      <Text numberOfLines={1} className="mt-2 text-label text-ink">
        {label}
      </Text>
    </Pressable>
  );
}
