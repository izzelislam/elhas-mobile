import React from 'react';
import {View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {MonthPicker} from '@/components/ui/MonthPicker';

/** Bulan yang ditampilkan di detail, format YYYY-MM. */
export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

type Props = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onApply: (bulan: string) => void;
};

export function DetailFilterSheet({visible, value, onClose, onApply}: Props) {
  return (
    <BottomSheet visible={visible} title="Pilih Bulan" onClose={onClose}>
      <View className="pb-2">
        <MonthPicker
          value={value}
          onChange={b => {
            onApply(b);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}
