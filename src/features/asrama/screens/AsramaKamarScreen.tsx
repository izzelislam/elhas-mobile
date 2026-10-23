import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AsramaHeader} from '../components/AsramaHeader';
import {KamarTab} from '../components/KamarTab';
import {getGedung} from '../services/asrama.service';
import type {Gedung, Kamar, KamarDetail} from '../types';
import AssignSantriScreen from './AssignSantriScreen';
import KamarDetailScreen from './KamarDetailScreen';

export default function AsramaKamarScreen({
  onBack,
  initialGedungId = null,
}: {
  onBack: () => void;
  initialGedungId?: number | null;
}) {
  const insets = useSafeAreaInsets();
  const [gedungId, setGedungId] = useState<number | null>(initialGedungId);
  const [gedung, setGedung] = useState<Gedung[]>([]);
  const [selected, setSelected] = useState<Kamar | null>(null);
  const [assign, setAssign] = useState<KamarDetail | null>(null);
  const [version, setVersion] = useState(0); // naik setelah penghuni berubah agar daftar dimuat ulang

  useEffect(() => {
    getGedung()
      .then(setGedung)
      .catch(() => {}); // chip gedung kosong bila gagal; daftar kamar tetap berfungsi
  }, [version]);

  if (assign) {
    return (
      <AssignSantriScreen
        kamar={assign}
        onBack={() => setAssign(null)}
        onSaved={() => {
          setAssign(null);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (selected) {
    return (
      <KamarDetailScreen
        key={version}
        kamar={selected}
        onBack={() => setSelected(null)}
        onAssign={setAssign}
        onChanged={() => setVersion(v => v + 1)}
      />
    );
  }
  return (
    <View className="flex-1 bg-canvas">
      <AsramaHeader title="Kamar Asrama" onBack={onBack} />
      <KamarTab
        key={version}
        gedung={gedung}
        gedungId={gedungId}
        onGedungChange={setGedungId}
        bottomPad={insets.bottom + 24}
        onSelect={setSelected}
      />
    </View>
  );
}
