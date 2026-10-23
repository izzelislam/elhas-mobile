import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ReceiptText, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {
  EMPTY_RIWAYAT_FILTER,
  RiwayatFilter,
  RiwayatFilterSheet,
} from '../components/RiwayatFilterSheet';
import {getRiwayatTabungan} from '../services/tabungan.service';
import type {RiwayatTransaksi} from '../types';

const PER_PAGE = 15;
const OK = '#059669';
const BAD = '#DC2626';

type Tipe = 'semua' | 'masuk' | 'keluar';
const TIPE: {key: Tipe; label: string}[] = [
  {key: 'semua', label: 'Semua'},
  {key: 'masuk', label: 'Setoran'},
  {key: 'keluar', label: 'Penarikan'},
];

const dayKey = (v: string) => {
  const d = new Date(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const dateFull = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

export default function RiwayatTabunganScreen({
  onBack,
  santri,
  initialTipe = 'semua',
}: {
  onBack: () => void;
  /** Bila diisi, riwayat dikunci ke santri ini (dibuka dari detail tabungan). */
  santri?: {id: number; nama: string};
  initialTipe?: Tipe;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<RiwayatTransaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [tipe, setTipe] = useState<Tipe>(initialTipe);
  const [filter, setFilter] = useState<RiwayatFilter>({...EMPTY_RIWAYAT_FILTER, santri: santri ?? null});
  const [sheet, setSheet] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getRiwayatTabungan({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          tanggal_mulai: filter.mulai ?? undefined,
          tanggal_selesai: filter.selesai ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.current_page;
        lastPage.current = res.last_page;
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat riwayat tabungan');
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
      items.filter(
        t =>
          (tipe === 'semua' || t.tipe === tipe) &&
          (!filter.mulai || dayKey(t.tanggal_transaksi) >= filter.mulai) &&
          (!filter.selesai || dayKey(t.tanggal_transaksi) <= filter.selesai) &&
          (!query ||
            t.tabungan?.santri?.nama_lengkap.toLowerCase().includes(query) ||
            t.keterangan?.toLowerCase().includes(query)),
      ),
    [items, tipe, query, filter.mulai, filter.selesai],
  );

  // tanggal (server mengabaikannya), tipe, dan pencarian disaring di aplikasi: muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query || tipe !== 'semua' || filter.mulai || filter.selesai) {
      more();
    }
  }, [query, tipe, filter.mulai, filter.selesai, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = (filter.santri && !santri ? 1 : 0) + (filter.mulai ? 1 : 0) + (filter.selesai ? 1 : 0);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Riwayat Tabungan</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {filter.santri ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {filter.santri.nama}
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 pb-3 pt-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari santri atau keterangan"
            returnKeyType="search"
            className="ml-2 h-11 flex-1 text-body text-ink"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <X size={18} color={colors.brand.DEFAULT} />
            </Pressable>
          ) : null}
        </View>
        <View className="mt-3 flex-row gap-2">
          {TIPE.map(o => {
            const active = tipe === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => setTipe(o.key)}
                className={`h-10 items-center justify-center rounded-full px-4 ${
                  active ? 'bg-brand' : 'bg-field'
                }`}>
                <Text
                  className={`text-label font-medium ${
                    active ? 'text-brand-foreground' : 'text-ink-muted'
                  }`}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Riwayat tidak dapat dimuat
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
              <ReceiptText size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada transaksi</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => {
            const masuk = item.tipe === 'masuk';
            const c = masuk ? OK : BAD;
            return (
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <Avatar name={item.tabungan?.santri?.nama_lengkap} size={40} />
                  <View className="ml-3 flex-1">
                    <Text className="text-label font-semibold text-ink" numberOfLines={1}>
                      {item.tabungan?.santri?.nama_lengkap ?? '-'}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      {[item.tabungan?.santri ? `NIS ${item.tabungan.santri.nis}` : null, item.tabungan?.no_rekening]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <View className="ml-2 items-end">
                    <Text style={{color: c}} className="text-label font-semibold">
                      {masuk ? '+' : '-'}
                      {rupiah(item.nominal)}
                    </Text>
                    <Text style={{color: c}} className="text-caption">
                      {masuk ? 'Setoran' : 'Penarikan'}
                    </Text>
                  </View>
                </View>
                {item.keterangan ? (
                  <Text className="mt-3 text-label text-ink">{item.keterangan}</Text>
                ) : null}
                <Text className="mt-2 text-caption text-ink-muted">
                  {[
                    dateFull(item.tanggal_transaksi),
                    item.status.charAt(0).toUpperCase() + item.status.slice(1),
                    item.bendahara?.name,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Card>
            );
          }}
        />
      )}

      <RiwayatFilterSheet
        visible={sheet}
        value={filter}
        showSantri={!santri}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
