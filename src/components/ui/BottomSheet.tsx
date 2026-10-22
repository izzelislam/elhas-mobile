import React from 'react';
import {Modal, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({visible, title, onClose, children}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        style={{paddingBottom: Math.max(insets.bottom, 16)}}
        className="rounded-t-card bg-surface px-5 pt-3">
        <View className="mb-3 h-1 w-10 self-center rounded-icon bg-tint-gray-bg" />
        {title ? <Text className="mb-2 text-title text-ink">{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}
