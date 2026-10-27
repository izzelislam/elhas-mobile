import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PiggyBank, Receipt} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {useCan} from '@/lib/permissions';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {statusColor, statusLabel} from '../components/tagihanStatus';
import {getRiwayatTabungan} from '../services/tabungan.service';
import {getTagihanList} from '../services/tagihan.service';
import type {RiwayatTransaksi, Tagihan} from '../types';
import BayarTagihanScreen from './BayarTagihanScreen';
import TagihanDetailScreen from './TagihanDetailScreen';

const PER_PAGE = 15;
const OK = '#059669';
const BAD = '#DC2626';

type Segment = 'tagihan' | 'tabungan';

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

type Page<T> = {items: T[]; lastPage: number};

/** Daftar berhalaman dengan tarik-untuk-refresh; `version` dinaikkan untuk memuat ulang dari halaman 1. */
function usePaged<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  errorMessage: string,
  version: number,
  enabled: boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await fetchPage(target);
        if (id !== requestId.current) {
          return;
        }
        page.current = target;
        lastPage.current = res.lastPage;
        setItems(prev => (target === 1 ? res.items : [...prev, ...res.items]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error(errorMessage);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage, errorMessage],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    load(1);
  }, [load, version, enabled]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    failed,
    retry: () => {
      setLoading(true);
      load(1);
    },
    refresh: () => {
      setRefreshing(true);
      load(1);
    },
    more: () => {
      if (page.current < lastPage.current && !loadingMore && !loading) {
        setLoadingMore(true);
        load(page.current + 1);
      }
    },
  };
}

function List<T extends {id: number}>({
  state,
  renderItem,
  emptyText,
  failedText,
  icon: Icon,
}: {
  state: ReturnType<typeof usePaged<T>>;
  renderItem: (item: T) => React.ReactElement;
  emptyText: string;
  failedText: string;
  icon: typeof Receipt;
}) {
  const insets = useSafeAreaInsets();
  if (state.loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand.DEFAULT} />
      </View>
    );
  }
  if (state.failed) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-4 text-center text-body text-ink-muted">{failedText}</Text>
        <Button title="Coba lagi" onPress={state.retry} />
      </View>
    );
  }
  return (
    <FlatList
      data={state.items}
      keyExtractor={i => String(i.id)}
      renderItem={({item}) => renderItem(item)}
      contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
      showsVerticalScrollIndicator={false}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
      onEndReached={state.more}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        <View className="mt-10 items-center">
          <Icon size={40} color={colors.text.muted} />
          <Text className="mt-3 text-body text-ink-muted">{emptyText}</Text>
        </View>
      }
      ListFooterComponent={
        state.loadingMore ? <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} /> : undefined
      }
    />
  );
}

function TagihanRow({item, onPress}: {item: Tagihan; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <Card className="mb-3 border-0 p-4">
        <View className="flex-row items-center">
          <Avatar name={item.santri?.nama_lengkap} size={40} />
          <View className="ml-3 flex-1">
            <Text className="text-label font-semibold text-ink" numberOfLines={1}>
              {item.nama}
            </Text>
            <Text className="text-caption text-ink-muted" numberOfLines={1}>
              {item.santri?.nama_lengkap ?? '-'}
            </Text>
          </View>
          <View className="ml-2 items-end">
            <Text className="text-label font-semibold text-ink">{rupiah(item.nominal)}</Text>
            <Text style={{color: statusColor(item.status)}} className="text-caption font-medium">
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>
        {item.tanggal_jatuh_tempo ? (
          <Text className="mt-2 text-caption text-ink-muted">
            Jatuh tempo {dateShort(item.tanggal_jatuh_tempo)}
            {item.sisa_tagihan > 0 && item.status !== 'lunas' ? ` · sisa ${rupiah(item.sisa_tagihan)}` : ''}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

function TabunganRow({item}: {item: RiwayatTransaksi}) {
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
          <Text className="text-caption text-ink-muted">{masuk ? 'Setoran' : 'Penarikan'}</Text>
        </View>
        <Text style={{color: c}} className="ml-2 text-label font-semibold">
          {masuk ? '+' : '-'}
          {rupiah(item.nominal)}
        </Text>
      </View>
      {item.keterangan ? <Text className="mt-2 text-label text-ink">{item.keterangan}</Text> : null}
      <Text className="mt-2 text-caption text-ink-muted">{dateShort(item.tanggal_transaksi)}</Text>
    </Card>
  );
}

/** Tab Transaksi: tagihan (SPP dan lainnya) dan riwayat tabungan, sesuai izin akun. */
export default function TransaksiScreen() {
  const insets = useSafeAreaInsets();
  const canTagihan = useCan(['tagihan.view', 'spp.view']);
  const canTabungan = useCan('tabungan.view');
  const [segment, setSegment] = useState<Segment>('tagihan');
  const [selected, setSelected] = useState<Tagihan | null>(null);
  const [bayar, setBayar] = useState<Tagihan | null>(null);
  const [version, setVersion] = useState(0); // naik setelah pembayaran agar daftar dimuat ulang

  const active: Segment | null = canTagihan && segment === 'tagihan' ? 'tagihan' : canTabungan ? 'tabungan' : canTagihan ? 'tagihan' : null;

  const fetchTagihan = useCallback(async (page: number) => {
    const res = await getTagihanList({per_page: PER_PAGE, page});
    return {items: res.data, lastPage: res.meta.last_page};
  }, []);
  const fetchTabungan = useCallback(async (page: number) => {
    const res = await getRiwayatTabungan({per_page: PER_PAGE, page});
    return {items: res.data, lastPage: res.last_page};
  }, []);
  const tagihan = usePaged(fetchTagihan, 'Gagal memuat tagihan', version, canTagihan);
  const tabungan = usePaged(fetchTabungan, 'Gagal memuat riwayat tabungan', version, canTabungan);

  if (bayar) {
    return (
      <BayarTagihanScreen
        tagihan={bayar}
        onBack={() => setBayar(null)}
        onSaved={() => {
          setBayar(null);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (selected) {
    return (
      <TagihanDetailScreen
        key={version}
        tagihan={tagihan.items.find(i => i.id === selected.id) ?? selected}
        onBack={() => setSelected(null)}
        onBayar={setBayar}
        onChanged={() => setVersion(v => v + 1)}
      />
    );
  }

  const segments = [
    canTagihan ? {key: 'tagihan' as const, label: 'Tagihan', icon: Receipt} : null,
    canTabungan ? {key: 'tabungan' as const, label: 'Tabungan', icon: PiggyBank} : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Text className="text-title text-brand-foreground">Transaksi</Text>
        {segments.length > 1 ? (
          <View className="mt-4 flex-row rounded-full bg-white/15 p-1">
            {segments.map(s => {
              const on = s.key === active;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSegment(s.key)}
                  className={`h-10 flex-1 flex-row items-center justify-center rounded-full ${
                    on ? 'bg-surface' : ''
                  }`}>
                  <s.icon size={16} color={on ? colors.brand.DEFAULT : colors.brand.foreground} />
                  <Text
                    className={`ml-2 text-label font-semibold ${
                      on ? 'text-brand' : 'text-brand-foreground'
                    }`}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {active === 'tagihan' ? (
        <List
          state={tagihan}
          renderItem={t => <TagihanRow item={t} onPress={() => setSelected(t)} />}
          emptyText="Belum ada tagihan"
          failedText="Tagihan tidak dapat dimuat"
          icon={Receipt}
        />
      ) : active === 'tabungan' ? (
        <List
          state={tabungan}
          renderItem={t => <TabunganRow item={t} />}
          emptyText="Belum ada transaksi tabungan"
          failedText="Riwayat tabungan tidak dapat dimuat"
          icon={PiggyBank}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Receipt size={40} color={colors.text.muted} />
          <Text className="mt-3 text-center text-body text-ink-muted">
            Akun ini tidak memiliki akses ke data transaksi
          </Text>
        </View>
      )}
    </View>
  );
}
