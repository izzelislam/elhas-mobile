import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, ScrollView, Text, Pressable, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {statusColor, tanggalId} from '../format';
import {AbsensiAsatidzah, getAbsensiAsatidzahDetail} from '../services/absensiAsatidzah.service';

const coord = (lat: number | null, lng: number | null) =>
  lat !== null && lng !== null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '-';

function Row({label, value}: {label: string; value: string}) {
  return (
    <View className="flex-row py-1.5">
      <Text className="w-28 text-label text-ink-muted">{label}</Text>
      <Text className="flex-1 text-label text-ink">{value}</Text>
    </View>
  );
}

function Foto({title, uri}: {title: string; uri: string | null}) {
  return (
    <View className="flex-1">
      <Text className="mb-1.5 text-caption text-ink-muted">{title}</Text>
      {uri ? (
        <Image source={{uri}} className="h-40 w-full rounded-card bg-field" resizeMode="cover" />
      ) : (
        <View className="h-40 items-center justify-center rounded-card bg-field">
          <Text className="text-caption text-ink-muted">Tidak ada foto</Text>
        </View>
      )}
    </View>
  );
}

/** Menampilkan data dari list lebih dulu, lalu menyegarkan dari detail (URL foto bertanda tangan kedaluwarsa). */
export default function AbsensiAsatidzahDetailScreen({
  absensi,
  onBack,
}: {
  absensi: AbsensiAsatidzah;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(absensi);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAbsensiAsatidzahDetail(absensi.id)
      .then(setData)
      .catch(() => toast.error('Gagal memuat detail absensi'))
      .finally(() => setLoading(false));
  }, [absensi.id]);

  const c = statusColor(data.status.value);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">Detail Absensi</Text>
        <Text className="text-label text-brand-foreground opacity-80">{tanggalId(data.tanggal)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <Card className="mb-3 border-0 p-4">
          <View className="flex-row items-center">
            <Avatar name={data.user?.name} size={44} />
            <View className="ml-3 flex-1">
              <Text className="text-body font-semibold text-ink">{data.user?.name ?? '-'}</Text>
              <Text className="text-caption text-ink-muted">
                {[data.user?.nip, data.user?.jabatan].filter(Boolean).join(' · ') || '-'}
              </Text>
            </View>
            <View style={{backgroundColor: c + '1A'}} className="rounded-full px-2.5 py-1">
              <Text style={{color: c}} className="text-caption font-semibold">
                {data.status.label}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mb-3 border-0 p-4">
          <Row label="Lokasi" value={data.lokasi?.nama ?? '-'} />
          <Row label="Radius" value={data.lokasi ? `${data.lokasi.radius_meter} m` : '-'} />
          <Row label="Jam masuk" value={data.jam_masuk ?? '-'} />
          <Row label="Jam pulang" value={data.jam_pulang ?? '-'} />
          <Row label="Koordinat masuk" value={coord(data.lat_masuk, data.lng_masuk)} />
          <Row label="Koordinat pulang" value={coord(data.lat_pulang, data.lng_pulang)} />
          <Row label="Keterangan" value={data.keterangan || '-'} />
        </Card>

        <Card className="border-0 p-4">
          <Text className="mb-3 text-label font-semibold text-ink">Foto</Text>
          {loading ? (
            <ActivityIndicator color={colors.brand.DEFAULT} />
          ) : (
            <View className="flex-row gap-3">
              <Foto title="Masuk" uri={data.foto_masuk_url} />
              <Foto title="Pulang" uri={data.foto_pulang_url} />
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
