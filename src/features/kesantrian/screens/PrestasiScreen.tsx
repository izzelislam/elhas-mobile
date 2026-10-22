import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Trophy, User} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getPrestasiList} from '../services/prestasi.service';
import type {Prestasi} from '../types';

const PER_PAGE = 15;

const KATEGORI: Record<string, string> = {
  akademik: '#2563EB',
  hafalan: '#059669',
  olahraga: '#EA580C',
  seni: '#7C3AED',
};
const kategoriColor = (k: string) => KATEGORI[k] ?? colors.brand.DEFAULT;

const dateId = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

function PrestasiItem({item, onPress}: {item: Prestasi; onPress: () => void}) {
  const c = kategoriColor(item.kategori);
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-3 border-0 p-4">
      <View className="flex-row">
        <View
          style={{backgroundColor: c + '1A'}}
          className="h-12 w-12 items-center justify-center rounded-2xl">
          <Trophy size={22} color={c} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-body font-semibold text-ink">{item.judul}</Text>
          {item.santri ? (
            <View className="mt-1 flex-row items-center">
              <User size={13} color={colors.text.muted} />
              <Text className="ml-1.5 flex-1 text-caption text-ink-muted" numberOfLines={1}>
                {item.santri.nama_lengkap} · NIS {item.santri.nis}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {item.deskripsi ? (
        <Text className="mt-3 text-label text-ink-muted">{item.deskripsi}</Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-2 border-t border-line pt-3">
        <View style={{backgroundColor: c + '1A'}} className="rounded-full px-2.5 py-0.5">
          <Text style={{color: c}} className="text-caption font-medium capitalize">
            {item.kategori}
          </Text>
        </View>
        <View className="rounded-full bg-brand-light px-2.5 py-0.5">
          <Text className="text-caption font-medium capitalize text-brand">{item.tingkat}</Text>
        </View>
        <View className="rounded-full bg-brand-light px-2.5 py-0.5">
          <Text className="text-caption font-medium text-brand">{item.peringkat}</Text>
        </View>
        <Text className="ml-auto text-caption text-ink-muted">{dateId(item.tanggal)}</Text>
      </View>
    </Card>
    </Pressable>
  );
}

export default function PrestasiScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (item: Prestasi) => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Prestasi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const busy = useRef(false);

  const load = useCallback(async (target: number) => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    try {
      const res = await getPrestasiList({per_page: PER_PAGE, page: target});
      page.current = res.current_page;
      lastPage.current = res.last_page;
      setHasMore(res.current_page < res.last_page);
      setTotal(res.total);
      setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
      setFailed(false);
    } catch {
      if (target === 1) {
        setFailed(true);
      }
      toast.error('Gagal memuat data prestasi');
    } finally {
      busy.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Prestasi</Text>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} prestasi tercatat
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Data prestasi tidak dapat dimuat
          </Text>
          <Button
            title="Coba lagi"
            onPress={() => {
              setLoading(true);
              load(1);
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={p => String(p.id)}
          renderItem={({item}) => <PrestasiItem item={item} onPress={() => onSelect(item)} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={() => {
            if (page.current < lastPage.current && !busy.current) {
              setLoadingMore(true);
              load(page.current + 1);
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Trophy size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada prestasi</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : hasMore ? (
              <Pressable
                onPress={() => {
                  setLoadingMore(true);
                  load(page.current + 1);
                }}
                className="items-center py-4 active:opacity-70">
                <Text className="text-label font-medium text-brand">Muat lebih banyak</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
    </View>
  );
}
