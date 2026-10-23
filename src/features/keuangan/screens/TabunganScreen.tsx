import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, PiggyBank, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {
  EMPTY_TABUNGAN_FILTER,
  TabunganFilter,
  TabunganFilterSheet,
} from '../components/TabunganFilterSheet';
import {getTabunganList} from '../services/tabungan.service';
import type {Tabungan, TabunganDetail} from '../types';
import TabunganDetailScreen from './TabunganDetailScreen';
import RiwayatTabunganScreen from './RiwayatTabunganScreen';
import TabunganTransaksiFormScreen from './TabunganTransaksiFormScreen';

const PER_PAGE = 15;

export default function TabunganScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Tabungan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TabunganFilter>(EMPTY_TABUNGAN_FILTER);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Tabungan | null>(null);
  const [form, setForm] = useState<TabunganDetail | null>(null);
  const [riwayat, setRiwayat] = useState<'semua' | 'keluar' | null>(null);
  const [version, setVersion] = useState(0); // naik setelah transaksi tersimpan agar saldo dimuat ulang
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getTabunganList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          no_rekening: filter.noRekening || undefined,
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
        toast.error('Gagal memuat tabungan');
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
  }, [load, version]);

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
            t =>
              t.santri?.nama_lengkap.toLowerCase().includes(query) ||
              t.santri?.nis.toLowerCase().includes(query) ||
              t.no_rekening.includes(query),
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

  const activeCount = (filter.santri ? 1 : 0) + (filter.noRekening ? 1 : 0);

  if (form) {
    return (
      <TabunganTransaksiFormScreen
        tabungan={form}
        onBack={() => setForm(null)}
        onSaved={() => {
          setForm(null);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (selected && riwayat && selected.santri) {
    return (
      <RiwayatTabunganScreen
        santri={{id: selected.santri.id, nama: selected.santri.nama_lengkap}}
        initialTipe={riwayat}
        onBack={() => setRiwayat(null)}
      />
    );
  }
  if (selected) {
    return (
      <TabunganDetailScreen
        key={version}
        tabungan={items.find(t => t.id === selected.id) ?? selected}
        onBack={() => setSelected(null)}
        onTransaksi={setForm}
        onRiwayat={setRiwayat}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Tabungan</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} rekening{activeCount > 0 ? ' (terfilter)' : ''}
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 py-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama, NIS, atau rekening"
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
            Tabungan tidak dapat dimuat
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
          keyExtractor={t => String(t.id)}
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
              <PiggyBank size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Rekening tidak ditemukan' : 'Belum ada tabungan'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => (
            <Pressable onPress={() => setSelected(item)} className="active:opacity-80">
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <Avatar name={item.santri?.nama_lengkap} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="text-body font-semibold text-ink" numberOfLines={1}>
                      {item.santri?.nama_lengkap ?? '-'}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      {[item.santri ? `NIS ${item.santri.nis}` : null, item.no_rekening]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <View className="ml-2 items-end">
                    <Text className="text-caption text-ink-muted">Saldo</Text>
                    <Text className="text-label font-semibold text-ink">
                      {rupiah(item.saldo)}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      <TabunganFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
