import React from 'react';
import {Pressable, Text, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '@/theme';

export type NavItem = {key: string; label: string; icon: LucideIcon};

type Props = {
  items: NavItem[];
  active: string;
  onChange: (key: string) => void;
};

export function BottomNav({items, active, onChange}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{paddingBottom: Math.max(insets.bottom, 8)}}
      className="flex-row rounded-t-card bg-brand pt-2">
      {items.map(({key, label, icon: Icon}) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            className="flex-1 items-center py-1">
            <Icon
              size={22}
              color={colors.brand.foreground}
              strokeWidth={on ? 2.4 : 1.8}
              style={{opacity: on ? 1 : 0.6}}
            />
            <Text
              className={`mt-1 text-caption text-brand-foreground ${on ? '' : 'opacity-60'}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
