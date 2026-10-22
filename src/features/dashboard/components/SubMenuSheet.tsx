import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronRight, Circle} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {colors} from '@/theme';
import type {MenuItem} from '@/navigation/menu.types';
import {MENU_VISUAL, SUBMENU_ICON} from '../menuVisual';

type Props = {
  menu: MenuItem | null;
  onClose: () => void;
  onSelect: (item: MenuItem) => void;
};

export function SubMenuSheet({menu, onClose, onSelect}: Props) {
  const tint = colors.tint[MENU_VISUAL[menu?.key ?? '']?.tint ?? 'gray'];

  return (
    <BottomSheet visible={!!menu} title={menu?.label} onClose={onClose}>
      <View className="gap-2 pb-2">
        {menu?.children?.map(sub => {
          const Icon = SUBMENU_ICON[sub.key] ?? Circle;
          return (
            <Pressable
              key={sub.key}
              onPress={() => onSelect(sub)}
              className="flex-row items-center rounded-card bg-brand-light/60 px-3 py-3 active:bg-brand-light">
              <View
                style={{backgroundColor: tint.bg}}
                className="h-10 w-10 items-center justify-center rounded-icon">
                <Icon size={20} color={tint.fg} strokeWidth={1.8} />
              </View>
              <Text className="ml-3 flex-1 text-body text-ink">{sub.label}</Text>
              <ChevronRight size={18} color={colors.text.muted} />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
