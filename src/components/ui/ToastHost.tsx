import React, {useEffect, useRef} from 'react';
import {Animated, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CircleAlert, CircleCheck} from 'lucide-react-native';
import {useToastStore} from '@/store/toast.store';

const DURATION = 3000;
const COLORS = {success: '#16A34A', error: '#DC2626'};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const {id, type, message, hide} = useToastStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) {
      return;
    }
    anim.setValue(0);
    Animated.timing(anim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
    const t = setTimeout(() => {
      Animated.timing(anim, {toValue: 0, duration: 200, useNativeDriver: true}).start(
        ({finished}) => finished && hide(),
      );
    }, DURATION);
    return () => clearTimeout(t);
  }, [id, message, anim, hide]);

  if (!message) {
    return null;
  }
  const Icon = type === 'success' ? CircleCheck : CircleAlert;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        opacity: anim,
        transform: [{translateY: anim.interpolate({inputRange: [0, 1], outputRange: [-16, 0]})}],
      }}>
      <View
        style={{backgroundColor: COLORS[type]}}
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3 shadow-lg">
        <Icon size={20} color="#fff" />
        <Text className="flex-1 text-body font-medium text-white">{message}</Text>
      </View>
    </Animated.View>
  );
}
