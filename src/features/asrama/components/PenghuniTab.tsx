import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {Search, SlidersHorizontal, Users, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {getPenghuni} from '../services/asrama.service';
import type {Gedung, Kamar, Penghuni} from '../types';
import {
  EMPTY_PENGHUNI_FILTER,
  PenghuniFilter,
  PenghuniFilterSheet,
} from './PenghuniFilterSheet';

const PER_PAGE = 15;

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

export function PenghuniTab({
  gedung,
  kamar,
  bottomPad,
}: {
  gedung: Gedung[];
  kamar: Kamar[];
  bottomPad: number;
}) {
  const [items, setItems] = useState<Penghuni[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<PenghuniFilter>(EMPTY_PENGHUNI_FILTER);
  const [sheet, setSheet] = useState(false);
  const [search, setSearch] = useState('');
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getPenghuni({
          page: target,
          per_page: PER_PAGE,
          gedung_asrama_id: filter.gedungId ?? undefined,
          kamar_asrama_id: filter.kamarId ?? undefined,
          status: filter.status ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.current_page;
        lastPage.current = res.last_page;
        setTotal(res.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat penghuni');
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

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query
        ? items.filter(
            p =>
              p.santri?.nama_lengkap.toLowerCase().includes(query) ||
              p.santri?.nis.toLowerCase().includes(query),
          )
        : items,
    [items, query],
  );

  // API belum punya pencarian nama: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query) {
      more();
    }
  }, [query, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount =
    (filter.gedungId !== null ? 1 : 0) +
    (filter.kamarId !== null ? 1 : 0) +
    (filter.status ? 1 : 0);

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-3 bg-surface px-5 py-3">
        <View className="h-11 flex-1 flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau NIS santri"
            returnKeyType="search"
            className="ml-2 flex-1 text-body text-ink"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <X size={18} color={colors.brand.DEFAULT} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setSheet(true)}
          hitSlop={8}
          accessibilityLabel="Filter"
          className="h-11 w-11 items-center justify-center rounded-card bg-field active:opacity-80">
          <SlidersHorizontal size={20} color={colors.brand.DEFAULT} />
          {activeCount > 0 ? (
            <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-icon border border-field bg-destructive" />
          ) : null}
        </Pressable>
      </View>
      <Text className="bg-surface px-5 pb-3 text-label text-ink-muted">
        {query ? `${visible.length} hasil` : `${total} penghuni`}
        {activeCount > 0 ? ' (terfilter)' : ''}
      </Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Penghuni tidak dapat dimuat
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
          keyExtractor={p => String(p.id)}
          contentContainerStyle={{padding: 20, paddingBottom: bottomPad}}
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
              <Users size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada penghuni'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => {
            const aktif = item.status === 'aktif';
            const c = aktif ? '#059669' : '#6B7280';
            const k = item.kamar_asrama;
            return (
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <Avatar name={item.santri?.nama_lengkap} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="text-body font-semibold text-ink" numberOfLines={1}>
                      {item.santri?.nama_lengkap ?? '-'}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      {item.santri ? `NIS ${item.santri.nis}` : ''}
                    </Text>
                  </View>
                  <View style={{backgroundColor: c + '1A'}} className="rounded-full px-2.5 py-1">
                    <Text style={{color: c}} className="text-caption font-semibold">
                      {aktif ? 'Aktif' : 'Keluar'}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 border-t border-line pt-3">
                  <Text className="text-label font-medium text-ink">
                    {k ? `${k.nomor_kamar} · ${k.nama_kamar}` : '-'}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {[k?.gedung_asrama?.nama, `Masuk ${dateShort(item.tanggal_masuk)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      )}

      <PenghuniFilterSheet
        visible={sheet}
        value={filter}
        gedung={gedung}
        kamar={kamar}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
