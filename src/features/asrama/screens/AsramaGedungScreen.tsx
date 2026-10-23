import React from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AsramaHeader} from '../components/AsramaHeader';
import {GedungTab} from '../components/GedungTab';

export default function AsramaGedungScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (gedungId: number) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-canvas">
      <AsramaHeader title="Gedung Asrama" onBack={onBack} />
      <GedungTab bottomPad={insets.bottom + 24} onSelect={g => onSelect(g.id)} />
    </View>
  );
}
