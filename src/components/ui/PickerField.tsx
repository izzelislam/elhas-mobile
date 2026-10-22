import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronRight, X} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';
import {colors} from '@/theme';

export function PickerField({
  icon: Icon,
  label,
  value,
  placeholder,
  onPress,
  onClear,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  onClear: () => void;
}) {
  return (
    <View>
      <Text className="mb-1.5 text-label font-medium text-ink">{label}</Text>
      <Pressable
        onPress={onPress}
        className="h-12 flex-row items-center rounded-card border border-line bg-field px-4">
        <Icon size={18} color={colors.text.muted} />
        <Text
          numberOfLines={1}
          className={`ml-3 flex-1 text-body ${value ? 'text-ink' : 'text-ink-muted'}`}>
          {value ?? placeholder}
        </Text>
        {value ? (
          <Pressable onPress={onClear} hitSlop={10}>
            <X size={18} color={colors.text.muted} />
          </Pressable>
        ) : (
          <ChevronRight size={18} color={colors.text.muted} />
        )}
      </Pressable>
    </View>
  );
}
