import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Plus, Search, ShieldAlert, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {useCan} from '@/lib/permissions';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {
  EMPTY_FILTER,
  PelanggaranFilter,
  PelanggaranFilterSheet,
} from '../components/PelanggaranFilterSheet';
import {getJenisPelanggaran, getPelanggaranList} from '../services/pelanggaran.service';
import type {Pelanggaran} from '../types';

const PER_PAGE = 15;

const KATEGORI: Record<string, string> = {
  ringan: '#D97706',
  sedang: '#EA580C',
  berat: '#DC2626',
};
const kategoriColor = (k?: string) => (k && KATEGORI[k]) || colors.brand.DEFAULT;

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

function PelanggaranItem({item, onPress}: {item: Pelanggaran; onPress: () => void}) {
  const kategori = item.jenis_pelanggaran?.kategori;
  const c = kategoriColor(kategori?.value);
  const sign = item.poin < 0 ? '−' : '+';
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-3 flex-row items-center border-0 p-4">
      <Avatar name={item.santri?.nama_lengkap} size={44} />
      <View className="ml-3 flex-1">
        <Text className="text-body font-semibold text-ink" numberOfLines={1}>
          {item.santri?.nama_lengkap ?? '-'}
        </Text>
        <Text className="mt-0.5 text-label text-ink" numberOfLines={2}>
          {item.jenis_pelanggaran?.nama ?? 'Pelanggaran'}
        </Text>
        <Text className="mt-0.5 text-caption text-ink-muted" numberOfLines={1}>
          {[kategori?.label, dateShort(item.tanggal)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={{backgroundColor: c + '1A'}} className="ml-3 rounded-full px-2.5 py-1">
        <Text style={{color: c}} className="text-caption font-semibold">
          {sign}
          {Math.abs(item.poin)} poin
        </Text>
      </View>
    </Card>
    </Pressable>
  );
}

function mergeJenis(
  prev: {id: number; nama: string}[],
  next: {id: number; nama: string}[],
) {
  const map = new Map(prev.map(j => [j.id, j]));
  next.forEach(j => map.set(j.id, j));
  return Array.from(map.values());
}

export default function PelanggaranScreen({
  onBack,
  onSelect,
  onCreate,
}: {
  onBack: () => void;
  onSelect: (item: Pelanggaran) => void;
  onCreate: () => void;
}) {
  const canCreate = useCan('pelanggaran.create');
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Pelanggaran[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);
  const [filter, setFilter] = useState<PelanggaranFilter>(EMPTY_FILTER);
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [jenisList, setJenisList] = useState<{id: number; nama: string}[]>([]);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getPelanggaranList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          jenis_pelanggaran_id: filter.jenisId ?? undefined,
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
        toast.error('Gagal memuat data pelanggaran');
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

  // daftar jenis: coba dari API, lalu lengkapi dari data yang pernah dimuat
  useEffect(() => {
    getJenisPelanggaran()
      .then(list => setJenisList(prev => mergeJenis(prev, list)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const fromItems = items
      .map(i => i.jenis_pelanggaran)
      .filter((j): j is NonNullable<typeof j> => !!j)
      .map(j => ({id: j.id, nama: j.nama}));
    if (fromItems.length) {
      setJenisList(prev => mergeJenis(prev, fromItems));
    }
  }, [items]);

  const query = search.trim().toLowerCase();
  const visibleItems = useMemo(
    () =>
      query
        ? items.filter(i => i.santri?.nama_lengkap.toLowerCase().includes(query))
        : items,
    [items, query],
  );

  // API belum punya parameter pencarian nama: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query && !loading && !loadingMore && page.current < lastPage.current) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  }, [query, items, loading, loadingMore, load]);

  const activeCount =
    (filter.santri ? 1 : 0) + (filter.jenisId !== null ? 1 : 0) + (filter.tanggal ? 1 : 0);
  const sortedJenis = useMemo(
    () => [...jenisList].sort((x, y) => x.nama.localeCompare(y.nama)),
    [jenisList],
  );

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Pelanggaran</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} pelanggaran{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
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
            Data pelanggaran tidak dapat dimuat
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
          data={visibleItems}
          keyExtractor={p => String(p.id)}
          renderItem={({item}) => <PelanggaranItem item={item} onPress={() => onSelect(item)} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 96}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={() => {
            if (page.current < lastPage.current && !loadingMore && !loading) {
              setLoadingMore(true);
              load(page.current + 1);
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <ShieldAlert size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada pelanggaran'}
              </Text>
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
      {canCreate ? (
      <Pressable
        onPress={onCreate}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Catat pelanggaran">
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
      ) : null}
      <PelanggaranFilterSheet
        visible={sheet}
        value={filter}
        jenisOptions={sortedJenis}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
