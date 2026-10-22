import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, NotebookPen, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {
  CatatanFilter,
  CatatanFilterSheet,
  EMPTY_CATATAN_FILTER,
} from '../components/CatatanFilterSheet';
import {getCatatanList} from '../services/catatan.service';
import type {Catatan} from '../types';

const PER_PAGE = 15;

const JENIS: Record<string, string> = {
  positif: '#059669',
  negatif: '#DC2626',
};
const jenisColor = (j: string) => JENIS[j] ?? colors.brand.DEFAULT;

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

function CatatanItem({item}: {item: Catatan}) {
  const c = jenisColor(item.jenis);
  const sign = item.poin_nilai < 0 ? '−' : '+';
  return (
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
        <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
          <Text style={{color: c}} className="text-caption font-semibold">
            {sign}
            {Math.abs(item.poin_nilai)} poin
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-label text-ink">{item.deskripsi}</Text>
      <View className="mt-3 flex-row items-center border-t border-line pt-3">
        <View style={{backgroundColor: c + '1A'}} className="rounded-full px-2.5 py-0.5">
          <Text style={{color: c}} className="text-caption font-medium capitalize">
            {item.jenis}
          </Text>
        </View>
        {item.pencatat ? (
          <Text className="ml-3 flex-1 text-caption text-ink-muted" numberOfLines={1}>
            oleh {item.pencatat.name}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export default function CatatanScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Catatan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);
  const [filter, setFilter] = useState<CatatanFilter>(EMPTY_CATATAN_FILTER);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getCatatanList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          jenis: filter.jenis ?? undefined,
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
        toast.error('Gagal memuat catatan');
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

  const activeCount =
    (filter.santri ? 1 : 0) + (filter.jenis ? 1 : 0) + (filter.tanggal ? 1 : 0);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query ? items.filter(i => i.santri?.nama_lengkap.toLowerCase().includes(query)) : items,
    [items, query],
  );

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  // API belum punya parameter pencarian: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query && !loading && !loadingMore) {
      more();
    }
  }, [query, items, loading, loadingMore]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Catatan Perilaku</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} catatan{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
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
            Catatan tidak dapat dimuat
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
          renderItem={({item}) => <CatatanItem item={item} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
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
              <NotebookPen size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada catatan'}
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
      <CatatanFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
