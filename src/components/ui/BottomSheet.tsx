import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  /** Bila diisi, tombol back device memanggil ini (mis. kembali ke langkah sebelumnya) alih-alih menutup sheet. */
  onBack?: () => void;
  children: React.ReactNode;
};

export function BottomSheet({visible, title, onClose, onBack, children}: Props) {
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();
  const [kbHeight, setKbHeight] = useState(0);

  // Modal di Android punya window sendiri sehingga adjustResize tidak berlaku;
  // angkat sheet manual setinggi keyboard supaya field tidak tertutup.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, e => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottomPad = kbHeight > 0 ? kbHeight : Math.max(insets.bottom, 16);
  const maxHeight = windowHeight - kbHeight - insets.top - 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onBack ?? onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        style={{paddingBottom: bottomPad, maxHeight}}
        className="rounded-t-card bg-surface px-5 pt-3">
        <View className="mb-3 h-1 w-10 self-center rounded-icon bg-tint-gray-bg" />
        {title ? <Text className="mb-2 text-title text-ink">{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}
