import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {Award} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import type {Santri} from '../types';

export function SantriItem({santri, onPress}: {santri: Santri; onPress?: () => void}) {
  const room = santri.asrama_aktif
    ? `${santri.asrama_aktif.nama_kamar} (${santri.asrama_aktif.nomor_kamar})`
    : null;
  const info = [santri.kelas_aktif?.nama, santri.halaqah_aktif?.nama, room].filter(Boolean);
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-3 flex-row items-center p-4">
      <Avatar uri={santri.foto ?? undefined} name={santri.nama_lengkap} size={52} />
      <View className="ml-3 flex-1">
        <Text className="text-body font-medium text-ink" numberOfLines={1}>
          {santri.nama_lengkap}
        </Text>
        <Text className="text-caption text-ink-muted">
          NIS {santri.nis} · {santri.jenis_kelamin.label} · {santri.umur} th
        </Text>
        {info.length ? (
          <Text className="mt-0.5 text-caption text-ink-muted" numberOfLines={2}>
            {info.join(' • ')}
          </Text>
        ) : null}
      </View>
      {santri.total_prestasi > 0 ? (
        <View className="ml-2 flex-row items-center">
          <Award size={14} color={colors.brand.DEFAULT} />
          <Text className="ml-1 text-caption font-medium text-brand">{santri.total_prestasi}</Text>
        </View>
      ) : null}
    </Card>
    </Pressable>
  );
}
