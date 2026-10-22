import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {JENIS, KUALITAS, ayatRange} from '../components/SetoranItem';
import type {Setoran} from '../types';

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
      <Text className="mt-0.5 text-body text-ink">{value}</Text>
    </View>
  );
}

const Divider = () => <View className="h-px bg-line" />;

/** Data dikirim lewat prop dari item daftar; endpoint detail belum dipakai. */
export default function SetoranDetailScreen({item, onBack}: {item: Setoran; onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const kualitasColor = KUALITAS[item.kualitas.value] ?? colors.brand.DEFAULT;
  const jenisColor = JENIS[item.jenis.value] ?? colors.brand.DEFAULT;
  const halaman =
    item.halaman_mulai != null
      ? item.halaman_mulai === item.halaman_selesai || item.halaman_selesai == null
        ? `${item.halaman_mulai}`
        : `${item.halaman_mulai} – ${item.halaman_selesai}`
      : null;

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
          <View className="mt-1">
            <Avatar name={item.santri?.nama_lengkap} size={84} />
          </View>
          <Text className="mt-3 text-center text-heading text-brand-foreground">
            {item.santri?.nama_lengkap ?? '-'}
          </Text>
          {item.santri ? (
            <Text className="text-label text-brand-foreground opacity-80">
              NIS {item.santri.nis}
            </Text>
          ) : null}
          <View className="mt-3 flex-row gap-2">
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-caption font-medium text-brand-foreground">
                {item.jenis.label}
              </Text>
            </View>
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-caption font-medium text-brand-foreground">
                {item.kualitas.label.split(' (')[0]}
              </Text>
            </View>
          </View>
        </View>

        <View className="-mt-10 px-5">
          <Card className="items-center border-0 p-5">
            <Text className="text-caption text-ink-muted">Hafalan</Text>
            <Text className="mt-1 text-center text-title text-ink">{ayatRange(item)}</Text>
            {halaman ? (
              <Text className="mt-1 text-label text-ink-muted">Halaman {halaman}</Text>
            ) : null}
          </Card>

          {item.catatan ? (
            <Card className="mt-4 border-0 p-4">
              <Text className="text-caption text-ink-muted">Catatan</Text>
              <Text className="mt-1 text-body text-ink">{item.catatan}</Text>
            </Card>
          ) : null}

          <Card className="mt-4 border-0 px-4 py-1">
            <Field label="Tanggal" value={dateId(item.tanggal)} />
            <Divider />
            <View className="py-2.5">
              <Text className="text-caption text-ink-muted">Jenis</Text>
              <View
                style={{backgroundColor: jenisColor + '1A'}}
                className="mt-1 self-start rounded-full px-2.5 py-0.5">
                <Text style={{color: jenisColor}} className="text-label font-medium">
                  {item.jenis.label}
                </Text>
              </View>
            </View>
            <Divider />
            <View className="py-2.5">
              <Text className="text-caption text-ink-muted">Kualitas</Text>
              <View
                style={{backgroundColor: kualitasColor + '1A'}}
                className="mt-1 self-start rounded-full px-2.5 py-0.5">
                <Text style={{color: kualitasColor}} className="text-label font-medium">
                  {item.kualitas.label}
                </Text>
              </View>
            </View>
            {item.ustadz ? (
              <>
                <Divider />
                <Field label="Ustadz penguji" value={item.ustadz.name} />
              </>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
