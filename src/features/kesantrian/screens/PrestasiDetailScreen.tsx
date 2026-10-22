import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Trophy} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getPrestasiDetail} from '../services/prestasi.service';
import type {Prestasi} from '../types';

const KATEGORI: Record<string, string> = {
  akademik: '#2563EB',
  hafalan: '#059669',
  olahraga: '#EA580C',
  seni: '#7C3AED',
};

const dateId = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function Field({label, value}: {label: string; value?: string | null}) {
  if (!value) {
    return null;
  }
  return (
    <View className="py-2.5">
      <Text className="text-caption text-ink-muted">{label}</Text>
      <Text className="mt-0.5 text-body capitalize text-ink">{value}</Text>
    </View>
  );
}

const Divider = () => <View className="h-px bg-line" />;

/** `initial` dari daftar ditampilkan langsung, lalu disegarkan dari API. */
export default function PrestasiDetailScreen({
  initial,
  onBack,
}: {
  initial: Prestasi;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<Prestasi>(initial);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    getPrestasiDetail(initial.id)
      .then(d => d?.id && setItem(prev => ({...prev, ...d})))
      .catch(() => toast.error('Gagal menyegarkan detail prestasi'))
      .finally(() => setRefreshing(false));
  }, [initial.id]);

  const c = KATEGORI[item.kategori] ?? colors.brand.DEFAULT;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View
          style={{paddingTop: insets.top + 24}}
          className="items-center overflow-hidden bg-brand px-5 pb-16">
          <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
          <View className="absolute -left-16 top-20 h-36 w-36 rounded-icon bg-white/10" />
          <View className="w-full flex-row items-center justify-between">
            <Pressable onPress={onBack} hitSlop={10}>
              <ArrowLeft size={22} color={colors.brand.foreground} />
            </Pressable>
            {refreshing ? <ActivityIndicator color={colors.brand.foreground} /> : null}
          </View>
          <View className="mt-2 h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Trophy size={38} color={colors.brand.foreground} />
          </View>
          <Text className="mt-3 text-center text-heading text-brand-foreground">
            {item.judul}
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-center gap-2">
            {[item.peringkat, item.tingkat, item.kategori].map(t => (
              <View key={t} className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-caption font-medium capitalize text-brand-foreground">
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="-mt-10 px-5">
          {item.santri ? (
            <Card className="flex-row items-center border-0 p-4">
              <Avatar
                uri={item.santri.foto ?? undefined}
                name={item.santri.nama_lengkap}
                size={52}
              />
              <View className="ml-3 flex-1">
                <Text className="text-caption text-ink-muted">Santri</Text>
                <Text className="text-body font-semibold text-ink">
                  {item.santri.nama_lengkap}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {[item.santri.nama_panggilan, `NIS ${item.santri.nis}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </Card>
          ) : null}

          {item.deskripsi ? (
            <Card className="mt-4 border-0 p-4">
              <Text className="text-caption text-ink-muted">Deskripsi</Text>
              <Text className="mt-1 text-body text-ink">{item.deskripsi}</Text>
            </Card>
          ) : null}

          <Card className="mt-4 border-0 px-4 py-1">
            <Field label="Tanggal" value={dateId(item.tanggal)} />
            <Divider />
            <Field label="Kategori" value={item.kategori} />
            <Divider />
            <Field label="Tingkat" value={item.tingkat} />
            <Divider />
            <Field label="Peringkat" value={item.peringkat} />
            {item.pencatat ? (
              <>
                <Divider />
                <Field label="Dicatat oleh" value={item.pencatat.name} />
              </>
            ) : null}
          </Card>

          {item.bukti_foto ? (
            <Card className="mt-4 overflow-hidden border-0 p-0">
              <Text className="px-4 pt-4 text-caption text-ink-muted">Bukti foto</Text>
              <Image
                source={{uri: item.bukti_foto}}
                style={{height: 220, margin: 16, borderRadius: 12}}
                resizeMode="cover"
              />
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
