import React from 'react';
import {ActivityIndicator, Pressable, PressableProps, Text} from 'react-native';
import {colors} from '@/theme';
import {cn} from '@/lib/utils';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'outline';
  className?: string;
  loading?: boolean;
};

export function Button({title, variant = 'primary', className, disabled, loading, ...props}: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        'h-12 items-center justify-center rounded-field',
        primary ? 'bg-brand active:bg-brand-dark' : 'border border-line bg-surface active:bg-canvas',
        (disabled || loading) && 'opacity-60',
        className,
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator color={primary ? colors.brand.foreground : colors.brand.DEFAULT} />
      ) : (
        <Text className={`text-body font-semibold ${primary ? 'text-brand-foreground' : 'text-ink'}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
