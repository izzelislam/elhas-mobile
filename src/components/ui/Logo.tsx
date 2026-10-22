import React from 'react';
import {View} from 'react-native';
import {School} from 'lucide-react-native';
import {colors} from '@/theme';

/** Placeholder logo; ganti isi dengan <Image> logo asli bila sudah ada */
export function Logo({size = 96}: {size?: number}) {
  return (
    <View
      style={{width: size, height: size}}
      className="items-center justify-center rounded-icon bg-surface">
      <School size={size * 0.5} color={colors.brand.DEFAULT} strokeWidth={1.6} />
    </View>
  );
}
