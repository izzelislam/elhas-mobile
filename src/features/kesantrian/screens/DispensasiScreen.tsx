import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, FileClock, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {
  DispensasiFilter,
  DispensasiFilterSheet,
  EMPTY_DISPENSASI_FILTER,
  label,
} from '../components/DispensasiFilterSheet';
import {getDispensasiList} from '../services/dispensasi.service';
import type {Dispensasi} from '../types';

const PER_PAGE = 15;

const STATUS: Record<string, string> = {
  menunggu: '#D97706',
  disetujui: '#059669',
  ditolak: '#DC2626',
};
const statusColor = (v: string) => STATUS[v] ?? '#6B7280';

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});

const dateFull = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

const dayCount = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);

function DispensasiItem({item}: {item: Dispensasi}) {
  const c = statusColor(item.status);
  return (
    <Card className="mb-3 border-0 p-4">
      <View className="flex-row items-center">
        <Avatar name={item.santri?.nama_lengkap} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-body font-semibold text-ink" numberOfLines={1}>
            {item.santri?.nama_lengkap ?? '-'}
          </Text>
          <Text className="text-caption text-ink-muted">NIS {item.santri?.nis ?? '-'}</Text>
        </View>
        <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
          <Text style={{color: c}} className="text-caption font-semibold">
            {label(item.status)}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        <View className="rounded-full bg-brand-light px-2.5 py-0.5">
          <Text className="text-caption font-medium text-brand">{label(item.jenis)}</Text>
        </View>
      </View>
      {item.keterangan ? (
        <Text className="mt-2 text-label text-ink">{item.keterangan}</Text>
      ) : null}
      <View className="mt-3 flex-row items-center border-t border-line pt-3">
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Mulai</Text>
          <Text className="text-label font-medium text-ink">{dateShort(item.tanggal_mulai)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Selesai</Text>
          <Text className="text-label font-medium text-ink">
            {dateFull(item.tanggal_selesai)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-caption text-ink-muted">Durasi</Text>
          <Text className="text-label font-medium text-ink">
            {dayCount(item.tanggal_mulai, item.tanggal_selesai)} hari
          </Text>
        </View>
      </View>
      {item.pengaju || item.disetujui_oleh ? (
        <Text className="mt-3 text-caption text-ink-muted">
          {[
            item.pengaju ? `Diajukan ${item.pengaju.name}` : null,
            item.disetujui_oleh ? `Disetujui ${item.disetujui_oleh.name}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
    </Card>
  );
}

export default function DispensasiScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Dispensasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DispensasiFilter>(EMPTY_DISPENSASI_FILTER);
  const [sheet, setSheet] = useState(false);
  const page = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getDispensasiList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = target;
        setHasMore(res.length >= PER_PAGE);
        setItems(prev => (target === 1 ? res : [...prev, ...res]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat dispensasi');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filter.santri],
  );

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load]);

  const more = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const statusOptions = useMemo(() => Array.from(new Set(items.map(i => i.status))).sort(), [items]);
  const jenisOptions = useMemo(() => Array.from(new Set(items.map(i => i.jenis))).sort(), [items]);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      items.filter(
        i =>
          (!filter.status || i.status === filter.status) &&
          (!filter.jenis || i.jenis === filter.jenis) &&
          (!query || i.santri?.nama_lengkap.toLowerCase().includes(query)),
      ),
    [items, filter.status, filter.jenis, query],
  );

  // status, jenis, dan pencarian disaring di aplikasi: muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query || filter.status || filter.jenis) {
      more();
    }
  }, [query, filter.status, filter.jenis, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = (filter.santri ? 1 : 0) + (filter.status ? 1 : 0) + (filter.jenis ? 1 : 0);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Dispensasi</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
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
            Dispensasi tidak dapat dimuat
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
          renderItem={({item}) => <DispensasiItem item={item} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
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
              <FileClock size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query || activeCount ? 'Dispensasi tidak ditemukan' : 'Belum ada dispensasi'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
        />
      )}

      <DispensasiFilterSheet
        visible={sheet}
        value={filter}
        statusOptions={statusOptions}
        jenisOptions={jenisOptions}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
