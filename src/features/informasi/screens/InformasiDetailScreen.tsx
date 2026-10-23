import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {colors} from '@/theme';
import {InformasiImage} from '../components/InformasiImage';
import {Informasi, getInformasiDetail} from '../services/informasi.service';
import {formatTanggal} from './InformasiScreen';

export default function InformasiDetailScreen({
  informasi,
  onBack,
}: {
  informasi: Informasi;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState(informasi);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInformasiDetail(informasi.id)
      .then(setItem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [informasi.id]);

  const image = item.gambar ?? item.thumbnail;

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Detail Informasi
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}
      >
        <InformasiImage
          uri={image}
          iconSize={48}
          className="mb-4 h-48 w-full overflow-hidden rounded-2xl"
        />
        <View className="flex-row items-center">
          <View className="rounded-full bg-field px-2.5 py-1">
            <Text className="text-caption font-semibold text-ink-muted">
              {item.kategori?.nama_kategori ?? '-'}
            </Text>
          </View>
          <Text className="ml-3 text-caption text-ink-muted">
            {formatTanggal(item.tanggal_publish ?? item.created_at)}
          </Text>
        </View>
        <Text className="mt-3 text-title text-ink">{item.judul}</Text>
        {loading ? (
          <ActivityIndicator className="mt-4" color={colors.brand.DEFAULT} />
        ) : null}
        <Text className="mt-4 text-body text-ink">{item.isi}</Text>
      </ScrollView>
    </View>
  );
}
