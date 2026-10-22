import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpenCheck, Plus, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {
  EMPTY_SETORAN_FILTER,
  SetoranFilter,
  SetoranFilterSheet,
} from '../components/SetoranFilterSheet';
import {SetoranItem} from '../components/SetoranItem';
import {getHalaqahList} from '../services/halaqah.service';
import {getSetoranList} from '../services/setoran.service';
import type {Setoran} from '../types';

const PER_PAGE = 15;

export default function SetoranScreen({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Setoran[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SetoranFilter>(EMPTY_SETORAN_FILTER);
  const [sheet, setSheet] = useState(false);
  const [halaqahOptions, setHalaqahOptions] = useState<{id: number; nama: string}[]>([]);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getSetoranList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          halaqah_id: filter.halaqahId ?? undefined,
          tanggal: filter.tanggal ?? undefined,
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
        toast.error('Gagal memuat setoran');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load]);

  useEffect(() => {
    getHalaqahList()
      .then(list => setHalaqahOptions(list.map(h => ({id: h.id, nama: h.nama}))))
      .catch(() => {}); // filter halaqah kosong bila gagal; daftar tetap berfungsi
  }, []);

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query ? items.filter(i => i.santri?.nama_lengkap.toLowerCase().includes(query)) : items,
    [items, query],
  );

  // API belum punya parameter pencarian nama: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query) {
      more();
    }
  }, [query, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount =
    (filter.santri ? 1 : 0) + (filter.halaqahId !== null ? 1 : 0) + (filter.tanggal ? 1 : 0);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Setoran</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} setoran{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 py-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
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
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Setoran tidak dapat dimuat
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
          data={visible}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => <SetoranItem item={item} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 96}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <BookOpenCheck size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada setoran'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : hasMore ? (
              <Pressable onPress={more} className="items-center py-4 active:opacity-70">
                <Text className="text-label font-medium text-brand">Muat lebih banyak</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}

      <Pressable
        onPress={onCreate}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Catat setoran">
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
      <SetoranFilterSheet
        visible={sheet}
        value={filter}
        halaqahOptions={halaqahOptions}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
