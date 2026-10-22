import React, {useState} from 'react';
import {Pressable, Text, TextInput, TextInputProps, View} from 'react-native';
import {Eye, EyeOff, LucideIcon} from 'lucide-react-native';
import {colors} from '@/theme';

type Props = Omit<TextInputProps, 'className'> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  /** Tampilkan toggle lihat/sembunyikan; otomatis secureTextEntry */
  password?: boolean;
};

export function TextField({label, icon: Icon, error, hint, password, onFocus, onBlur, ...props}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const border = error
    ? 'border-destructive'
    : focused
    ? 'border-brand bg-surface'
    : 'border-transparent bg-canvas';
  const iconColor = focused ? colors.brand.DEFAULT : colors.text.muted;
  const Toggle = hidden ? Eye : EyeOff;

  return (
    <View>
      <Text className="mb-1.5 text-label font-medium text-ink">{label}</Text>
      <View className={`h-12 flex-row items-center rounded-field border px-3.5 ${border}`}>
        {Icon ? <Icon size={18} color={iconColor} strokeWidth={1.8} /> : null}
        <TextInput
          {...props}
          secureTextEntry={password ? hidden : props.secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.brand.DEFAULT}
          cursorColor={colors.brand.DEFAULT}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`h-full flex-1 text-body text-ink ${Icon ? 'ml-2.5' : ''}`}
        />
        {password ? (
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Toggle size={18} color={colors.text.muted} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-1 text-caption text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-caption text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
