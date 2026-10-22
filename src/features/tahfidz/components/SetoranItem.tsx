import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {useSetoranDetail} from '../store';
import {surahName} from '../surah';
import type {Setoran} from '../types';

export const KUALITAS: Record<string, string> = {
  mumtaz: '#059669',
  jayyid_jiddan: '#2563EB',
  jayyid: '#D97706',
  maqbul: '#EA580C',
};
export const JENIS: Record<string, string> = {
  setoran_baru: '#7C3AED',
  murajaah: '#0891B2',
};

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

export function ayatRange(s: Setoran) {
  const a = `${surahName(s.surah_mulai)} ${s.ayat_mulai}`;
  const b = `${surahName(s.surah_selesai)} ${s.ayat_selesai}`;
  return a === b ? a : `${a} – ${b}`;
}

function Chip({label, color}: {label: string; color: string}) {
  return (
    <View style={{backgroundColor: color + '1A'}} className="rounded-full px-2.5 py-0.5">
      <Text style={{color}} className="text-caption font-medium">
        {label}
      </Text>
    </View>
  );
}

export function SetoranItem({item}: {item: Setoran}) {
  const open = useSetoranDetail(s => s.open);
  const halaman =
    item.halaman_mulai != null
      ? item.halaman_mulai === item.halaman_selesai || item.halaman_selesai == null
        ? `Hal. ${item.halaman_mulai}`
        : `Hal. ${item.halaman_mulai}–${item.halaman_selesai}`
      : null;
  return (
    <Pressable onPress={() => open(item)} className="active:opacity-80">
    <Card className="mb-3 border-0 p-4">
      <View className="flex-row items-center">
        <Avatar name={item.santri?.nama_lengkap} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-body font-semibold text-ink" numberOfLines={1}>
            {item.santri?.nama_lengkap ?? '-'}
          </Text>
          <Text className="text-caption text-ink-muted">
            {[item.santri ? `NIS ${item.santri.nis}` : null, dateShort(item.tanggal)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-label font-medium text-ink">{ayatRange(item)}</Text>
      {halaman ? <Text className="text-caption text-ink-muted">{halaman}</Text> : null}
      {item.catatan ? (
        <Text className="mt-2 text-label text-ink-muted">{item.catatan}</Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-2 border-t border-line pt-3">
        <Chip label={item.jenis.label} color={JENIS[item.jenis.value] ?? colors.brand.DEFAULT} />
        <Chip
          label={item.kualitas.label.split(' (')[0]}
          color={KUALITAS[item.kualitas.value] ?? colors.brand.DEFAULT}
        />
        {item.ustadz ? (
          <Text className="ml-auto text-caption text-ink-muted" numberOfLines={1}>
            {item.ustadz.name}
          </Text>
        ) : null}
      </View>
    </Card>
    </Pressable>
  );
}
