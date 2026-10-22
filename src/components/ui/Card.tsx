import React from 'react';
import {View, ViewProps} from 'react-native';
import {cn} from '@/lib/utils';

/** Kartu flat: putih + border tipis di atas latar `canvas`, tanpa shadow */
export function Card({className, ...props}: ViewProps & {className?: string}) {
  return (
    <View
      className={cn('rounded-card border border-line bg-surface p-5', className)}
      {...props}
    />
  );
}
