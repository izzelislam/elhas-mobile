import React from 'react';
import {Modal, Pressable, Text, View} from 'react-native';
import {CircleAlert, CircleCheck, Info, LucideIcon} from 'lucide-react-native';
import {colors} from '@/theme';

export type DialogVariant = 'info' | 'success' | 'destructive';

const VARIANT: Record<DialogVariant, {icon: LucideIcon; bg: string; fg: string}> = {
  info: {icon: Info, bg: colors.brand.light, fg: colors.brand.DEFAULT},
  success: {icon: CircleCheck, ...colors.tint.green},
  destructive: {icon: CircleAlert, bg: '#FDE8E8', fg: '#DC2626'},
};

export type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  variant?: DialogVariant;
  /** Override ikon bawaan variant */
  icon?: LucideIcon;
  confirmText?: string;
  /** Jika kosong, tombol batal tidak ditampilkan (mode alert) */
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function Dialog({
  visible,
  title,
  message,
  variant = 'info',
  icon,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}: DialogProps) {
  const v = VARIANT[variant];
  const Icon = icon ?? v.icon;
  const confirmBg = variant === 'destructive' ? 'bg-destructive' : 'bg-brand';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onCancel} />
        <View className="w-full items-center rounded-card bg-surface px-6 pb-5 pt-6">
          <View
            style={{backgroundColor: v.bg}}
            className="h-14 w-14 items-center justify-center rounded-icon">
            <Icon size={26} color={v.fg} strokeWidth={1.8} />
          </View>
          <Text className="mt-4 text-center text-title text-ink">{title}</Text>
          {message ? (
            <Text className="mt-1.5 text-center text-body text-ink-muted">{message}</Text>
          ) : null}
          <View className="mt-6 w-full flex-row gap-3">
            {cancelText ? (
              <Pressable
                onPress={onCancel}
                className="flex-1 items-center rounded-card bg-brand-light py-3 active:opacity-70">
                <Text className="text-body font-semibold text-ink">{cancelText}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center rounded-card py-3 active:opacity-80 ${confirmBg}`}>
              <Text className="text-body font-semibold text-brand-foreground">
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

