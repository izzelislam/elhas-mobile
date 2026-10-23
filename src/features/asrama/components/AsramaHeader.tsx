import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {colors} from '@/theme';

export function AsramaHeader({title, onBack}: {title: string; onBack: () => void}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
      <View className="flex-row items-center">
        <Pressable onPress={onBack} hitSlop={10}>
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="ml-3 text-title text-brand-foreground">{title}</Text>
      </View>
    </View>
  );
}
