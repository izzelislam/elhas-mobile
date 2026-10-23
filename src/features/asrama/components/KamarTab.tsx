import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, ScrollView, Text, View} from 'react-native';
import {BedDouble, ChevronRight} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {getKamar} from '../services/asrama.service';
import type {Gedung, Kamar} from '../types';
import {CapacityBar, genderLabel} from './CapacityBar';

export function KamarTab({
  gedung,
  gedungId,
  onGedungChange,
  bottomPad,
  onSelect,
}: {
  gedung: Gedung[];
  gedungId: number | null;
  onGedungChange: (id: number | null) => void;
  bottomPad: number;
  onSelect: (k: Kamar) => void;
}) {
  const [items, setItems] = useState<Kamar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await getKamar({gedung_asrama_id: gedungId ?? undefined});
      if (id !== requestId.current) {
        return;
      }
      setItems(res);
      setFailed(false);
    } catch {
      if (id !== requestId.current) {
        return;
      }
      setFailed(true);
      toast.error('Gagal memuat kamar');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [gedungId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const chips = [{id: null as number | null, nama: 'Semua'}, ...gedung];

  return (
    <View className="flex-1">
      <View className="bg-surface py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 20, gap: 8, alignItems: 'center'}}>
          {chips.map(g => {
            const active = g.id === gedungId;
            return (
              <Pressable
                key={String(g.id)}
                onPress={() => onGedungChange(g.id)}
                className={`h-10 items-center justify-center rounded-full border px-4 ${
                  active ? 'border-brand bg-brand' : 'border-line bg-field'
                }`}>
                <Text
                  className={`text-label font-medium ${
                    active ? 'text-brand-foreground' : 'text-ink'
                  }`}>
                  {g.nama}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Kamar tidak dapat dimuat
          </Text>
          <Button
            title="Coba lagi"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={k => String(k.id)}
          contentContainerStyle={{padding: 20, paddingBottom: bottomPad}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <BedDouble size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada kamar</Text>
            </View>
          }
          renderItem={({item}) => (
            <Pressable onPress={() => onSelect(item)} className="active:opacity-80">
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-body font-semibold text-ink" numberOfLines={1}>
                      {item.nomor_kamar} · {item.nama_kamar}
                    </Text>
                    <Text className="text-caption text-ink-muted" numberOfLines={1}>
                      {[item.gedung_asrama?.nama, `Lantai ${item.lantai}`, genderLabel(item.jenis_kelamin)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.text.muted} />
                </View>
                <View className="mt-3">
                  <CapacityBar count={item.penghuni_asrama_count ?? 0} cap={item.kapasitas} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
