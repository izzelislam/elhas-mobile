import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpen, Search, UserRound, Users, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getSetoranList} from '../services/setoran.service';
import {SetoranItem} from '../components/SetoranItem';
import type {Halaqah, Setoran} from '../types';

const PER_PAGE = 15;

export default function HalaqahDetailScreen({
  halaqah,
  onBack,
}: {
  halaqah: Halaqah;
  onBack: () => void;
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
  const page = useRef(1);
  const lastPage = useRef(1);
  const busy = useRef(false);

  const load = useCallback(
    async (target: number) => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      try {
        const res = await getSetoranList({
          halaqah_id: halaqah.id,
          per_page: PER_PAGE,
          page: target,
        });
        page.current = res.meta.current_page;
        lastPage.current = res.meta.last_page;
        setHasMore(res.meta.current_page < res.meta.last_page);
        setTotal(res.meta.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat setoran');
      } finally {
        busy.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [halaqah.id],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const more = () => {
    if (page.current < lastPage.current && !busy.current) {
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

  // API belum punya parameter pencarian: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query && !loading && !loadingMore) {
      more();
    }
  }, [query, items, loading, loadingMore]); // eslint-disable-line react-hooks/exhaustive-deps

  const header = (
    <View
      style={{paddingTop: insets.top + 24}}
      className="overflow-hidden bg-brand px-5 pb-5">
      <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
      <Pressable onPress={onBack} hitSlop={10} className="self-start">
        <ArrowLeft size={22} color={colors.brand.foreground} />
      </Pressable>
      <View className="mt-3 flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
          <BookOpen size={26} color={colors.brand.foreground} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-heading text-brand-foreground" numberOfLines={1}>
            {halaqah.nama}
          </Text>
          <View className="mt-1 flex-row items-center">
            <UserRound size={13} color={colors.brand.foreground} />
            <Text className="ml-1.5 text-label text-brand-foreground opacity-80">
              {halaqah.musyrif?.name ?? '-'}
            </Text>
            <Users size={13} color={colors.brand.foreground} style={{marginLeft: 12}} />
            <Text className="ml-1.5 text-label text-brand-foreground opacity-80">
              {halaqah.jumlah_santri} santri
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      {header}

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
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            total > 0 ? (
              <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
                SETORAN HAFALAN · {total}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <BookOpen size={40} color={colors.text.muted} />
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
    </View>
  );
}
