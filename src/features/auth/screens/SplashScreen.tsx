import React, {useEffect, useRef} from 'react';
import {Animated, Text, View} from 'react-native';
import {Logo} from '@/components/ui/Logo';

const DURATION_MS = 1800;

export default function SplashScreen({onFinish}: {onFinish: () => void}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {toValue: 1, duration: 700, useNativeDriver: true}).start();
    // TODO: bisa digabung dengan restore token/session sebelum onFinish
    const t = setTimeout(onFinish, DURATION_MS);
    return () => clearTimeout(t);
  }, [anim, onFinish]);

  return (
    <View className="flex-1 items-center justify-center bg-brand">
      <Animated.View
        style={{
          opacity: anim,
          transform: [{scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.85, 1]})}],
        }}
        className="items-center">
        <Logo size={104} />
        <Text className="mt-5 text-heading text-brand-foreground">Elhas Mobile</Text>
        <Text className="mt-1 text-body text-brand-foreground opacity-80">
          Pondok Pesantren Elhas
        </Text>
      </Animated.View>
      <Text className="absolute bottom-10 text-caption text-brand-foreground opacity-60">
        v0.0.1
      </Text>
    </View>
  );
}
