import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ShieldAlert} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import type {Pelanggaran} from '../types';

const KATEGORI: Record<string, string> = {
  ringan: '#D97706',
  sedang: '#EA580C',
  berat: '#DC2626',
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

export default function PelanggaranDetailScreen({
  item,
  onBack,
}: {
  item: Pelanggaran;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const jenis = item.jenis_pelanggaran;
  const c = (jenis && KATEGORI[jenis.kategori.value]) || colors.brand.DEFAULT;
  const sign = item.poin < 0 ? '−' : '+';

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
          <Pressable onPress={onBack} hitSlop={10} className="self-start">
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <View className="mt-2 h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <ShieldAlert size={38} color={colors.brand.foreground} />
          </View>
          <Text className="mt-3 text-center text-heading text-brand-foreground">
            {jenis?.nama ?? 'Pelanggaran'}
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-center gap-2">
            {jenis ? (
              <View className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-caption font-medium text-brand-foreground">
                  {jenis.kategori.label}
                </Text>
              </View>
            ) : null}
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-caption font-medium text-brand-foreground">
                {sign}
                {Math.abs(item.poin)} poin
              </Text>
            </View>
          </View>
        </View>

        <View className="-mt-10 px-5">
          {item.santri ? (
            <Card className="flex-row items-center border-0 p-4">
              <Avatar name={item.santri.nama_lengkap} size={52} />
              <View className="ml-3 flex-1">
                <Text className="text-caption text-ink-muted">Santri</Text>
                <Text className="text-body font-semibold text-ink">
                  {item.santri.nama_lengkap}
                </Text>
                <Text className="text-caption text-ink-muted">NIS {item.santri.nis}</Text>
              </View>
            </Card>
          ) : null}

          {item.catatan ? (
            <Card className="mt-4 border-0 p-4">
              <Text className="text-caption text-ink-muted">Catatan</Text>
              <Text className="mt-1 text-body text-ink">{item.catatan}</Text>
            </Card>
          ) : null}

          <Card className="mt-4 border-0 px-4 py-1">
            <Field label="Tanggal" value={dateId(item.tanggal)} />
            <Divider />
            <Field label="Jenis Pelanggaran" value={jenis?.nama} />
            <Divider />
            <Field label="Kategori" value={jenis?.kategori.label} />
            <Divider />
            <View className="py-2.5">
              <Text className="text-caption text-ink-muted">Poin</Text>
              <View
                style={{backgroundColor: c + '1A'}}
                className="mt-1 self-start rounded-full px-2.5 py-0.5">
                <Text style={{color: c}} className="text-label font-semibold">
                  {sign}
                  {Math.abs(item.poin)} poin
                </Text>
              </View>
            </View>
            {item.pencatat ? (
              <>
                <Divider />
                <Field label="Dicatat oleh" value={item.pencatat.name} />
              </>
            ) : null}
            <Divider />
            <Field label="Status" value={item.status} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
