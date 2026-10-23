import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AsramaHeader} from '../components/AsramaHeader';
import {PenghuniTab} from '../components/PenghuniTab';
import {getGedung, getKamar} from '../services/asrama.service';
import type {Gedung, Kamar} from '../types';

export default function AsramaPenghuniScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [gedung, setGedung] = useState<Gedung[]>([]);
  const [kamar, setKamar] = useState<Kamar[]>([]);

  // referensi filter; kosong bila gagal, daftar tetap berfungsi
  useEffect(() => {
    getGedung()
      .then(setGedung)
      .catch(() => {});
    getKamar()
      .then(setKamar)
      .catch(() => {});
  }, []);

  return (
    <View className="flex-1 bg-canvas">
      <AsramaHeader title="Penghuni Asrama" onBack={onBack} />
      <PenghuniTab gedung={gedung} kamar={kamar} bottomPad={insets.bottom + 24} />
    </View>
  );
}
