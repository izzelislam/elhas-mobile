import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {Building2, ChevronRight} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {getGedung} from '../services/asrama.service';
import type {Gedung} from '../types';

export function GedungTab({
  bottomPad,
  onSelect,
}: {
  bottomPad: number;
  onSelect: (g: Gedung) => void;
}) {
  const [items, setItems] = useState<Gedung[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await getGedung());
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat gedung');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand.DEFAULT} />
      </View>
    );
  }
  if (failed) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-4 text-center text-body text-ink-muted">
          Gedung tidak dapat dimuat
        </Text>
        <Button
          title="Coba lagi"
          onPress={() => {
            setLoading(true);
            load();
          }}
        />
      </View>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={g => String(g.id)}
      contentContainerStyle={{padding: 20, paddingBottom: bottomPad}}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      ListEmptyComponent={
        <View className="mt-10 items-center">
          <Building2 size={40} color={colors.text.muted} />
          <Text className="mt-3 text-body text-ink-muted">Belum ada gedung</Text>
        </View>
      }
      renderItem={({item}) => (
        <Pressable onPress={() => onSelect(item)} className="active:opacity-80">
          <Card className="mb-3 border-0 p-4">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-card bg-brand-light">
                <Building2 size={22} color={colors.brand.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-body font-semibold text-ink" numberOfLines={2}>
                  {item.nama}
                </Text>
                <Text className="text-caption text-ink-muted">Kode {item.kode}</Text>
              </View>
              <ChevronRight size={20} color={colors.text.muted} />
            </View>
            {item.keterangan ? (
              <Text className="mt-3 text-label text-ink-muted">{item.keterangan}</Text>
            ) : null}
            <View className="mt-3 flex-row border-t border-line pt-3">
              <View className="flex-1">
                <Text className="text-caption text-ink-muted">Kamar</Text>
                <Text className="text-label font-semibold text-ink">
                  {item.kamar_asrama_count ?? 0}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-caption text-ink-muted">Kapasitas</Text>
                <Text className="text-label font-semibold text-ink">{item.kapasitas} santri</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
