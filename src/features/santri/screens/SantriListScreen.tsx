import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Search, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {SantriItem} from '../components/SantriItem';
import {getSantriList} from '../services/santri.service';
import type {Santri} from '../types';

const PER_PAGE = 15;

const STATUS_OPTIONS = [
  {value: 'aktif', label: 'Aktif'},
  {value: 'alumni', label: 'Alumni'},
  {value: 'pindah', label: 'Pindah'},
  {value: 'dikeluarkan', label: 'Dikeluarkan'},
  {value: 'cuti', label: 'Cuti'},
  {value: 'all', label: 'Semua'},
];

export default function SantriListScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState('aktif');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getSantriList({
          status,
          search: query || undefined,
          per_page: PER_PAGE,
          page: target,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.meta.current_page;
        lastPage.current = res.meta.last_page;
        setHasMore(res.meta.current_page < res.meta.last_page);
        setTotal(res.meta.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat data santri');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [status, query],
  );

  // debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // muat ulang dari halaman 1 saat filter berubah
  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load]);

  const onEndReached = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Santri</Text>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} santri
          </Text>
        ) : null}
      </View>

      <View className="bg-surface pb-1 pt-3">
        <View className="mx-5 flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama santri"
            returnKeyType="search"
            className="ml-2 h-11 flex-1 text-body text-ink"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <X size={18} color={colors.brand.DEFAULT} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 20, paddingVertical: 10, gap: 8}}>
          {STATUS_OPTIONS.map(o => {
            const active = o.value === status;
            return (
              <Pressable
                key={o.value}
                onPress={() => setStatus(o.value)}
                className={`rounded-full px-4 py-1.5 ${active ? 'bg-brand' : 'bg-brand-light'}`}>
                <Text
                  className={`text-label font-medium ${
                    active ? 'text-brand-foreground' : 'text-brand'
                  }`}>
                  {o.label}
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
            Data santri tidak dapat dimuat
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
          keyExtractor={s => String(s.id)}
          renderItem={({item}) => <SantriItem santri={item} onPress={() => onSelect(item.id)} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text className="mt-10 text-center text-body text-ink-muted">
              Belum ada data santri
            </Text>
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
