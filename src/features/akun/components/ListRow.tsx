import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronRight, LucideIcon} from 'lucide-react-native';
import {colors, TintName} from '@/theme';

type Props = {
  label: string;
  icon: LucideIcon;
  tint?: TintName;
  danger?: boolean;
  onPress?: () => void;
};

export function ListRow({label, icon: Icon, tint = 'sky', danger, onPress}: Props) {
  const {bg, fg} = danger ? {bg: '#FDE8E8', fg: '#DC2626'} : colors.tint[tint];
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 active:bg-canvas">
      <View
        style={{backgroundColor: bg}}
        className="h-10 w-10 items-center justify-center rounded-icon">
        <Icon size={20} color={fg} strokeWidth={1.8} />
      </View>
      <Text className={`ml-3 flex-1 text-body ${danger ? 'text-destructive' : 'text-ink'}`}>
        {label}
      </Text>
      {danger ? null : <ChevronRight size={18} color={colors.text.muted} />}
    </Pressable>
  );
}
