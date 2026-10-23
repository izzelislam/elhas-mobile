import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Receipt, Search, Wallet, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {useAuthStore} from '@/store/auth.store';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {PilihTagihanSheet} from '../components/PilihTagihanSheet';
import {rupiah} from '../components/format';
import {
  EMPTY_TAGIHAN_FILTER,
  TagihanFilter,
  TagihanFilterSheet,
} from '../components/TagihanFilterSheet';
import {statusColor, statusLabel} from '../components/tagihanStatus';
import {getTagihanList} from '../services/tagihan.service';
import type {Tagihan} from '../types';
import BayarTagihanScreen from './BayarTagihanScreen';
import TagihanDetailScreen from './TagihanDetailScreen';

const PER_PAGE = 15;

// Tombol bayar untuk wali; sementara tampil juga di mode debug (__DEV__) untuk pengujian.
const SHOW_BAYAR_FOR_ALL = __DEV__;

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

export default function TagihanScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Tagihan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TagihanFilter>(EMPTY_TAGIHAN_FILTER);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Tagihan | null>(null);
  const isWali = useAuthStore(s => s.user?.roles.some(r => /wali/i.test(r)) ?? false);
  const [pilih, setPilih] = useState(false);
  const [bayar, setBayar] = useState<Tagihan | null>(null);
  const [version, setVersion] = useState(0); // naik setelah pembayaran agar detail dan daftar dimuat ulang
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getTagihanList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          tahun_ajaran_id: filter.tahunAjaranId ?? undefined,
          status: filter.status ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.meta.current_page;
        lastPage.current = res.meta.last_page;
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
        toast.error('Gagal memuat tagihan');
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
              t.santri?.nis.includes(query) ||
              t.nama.toLowerCase().includes(query),
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

  const activeCount = (filter.santri ? 1 : 0) + (filter.tahunAjaranId ? 1 : 0) + (filter.status ? 1 : 0);

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
        tagihan={items.find(i => i.id === selected.id) ?? selected}
        onBack={() => setSelected(null)}
        onBayar={setBayar}
        onChanged={() => setVersion(v => v + 1)}
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
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Tagihan</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} tagihan{filter.santri ? ` · ${filter.santri.nama}` : ''}
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 py-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari santri, NIS, atau nama tagihan"
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
          <Text className="mb-4 text-center text-body text-ink-muted">Tagihan tidak dapat dimuat</Text>
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
              <Receipt size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada tagihan</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} /> : undefined
          }
          renderItem={({item}) => {
            const c = statusColor(item.status);
            return (
              <Pressable onPress={() => setSelected(item)} className="active:opacity-80">
                <Card className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Avatar name={item.santri?.nama_lengkap} size={40} />
                    <View className="ml-3 flex-1">
                      <Text className="text-label font-semibold text-ink" numberOfLines={1}>
                        {item.santri?.nama_lengkap ?? '-'}
                      </Text>
                      <Text className="text-caption text-ink-muted">NIS {item.santri?.nis ?? '-'}</Text>
                    </View>
                    <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
                      <Text style={{color: c}} className="text-caption font-semibold">
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-label text-ink">{item.nama}</Text>
                  <View className="mt-3 flex-row items-center border-t border-line pt-3">
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Nominal</Text>
                      <Text className="text-label font-medium text-ink">{rupiah(item.nominal)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Sisa</Text>
                      <Text style={{color: item.sisa_tagihan > 0 ? '#DC2626' : '#059669'}} className="text-label font-medium">
                        {rupiah(item.sisa_tagihan)}
                      </Text>
                    </View>
                    {item.tanggal_jatuh_tempo ? (
                      <View className="items-end">
                        <Text className="text-caption text-ink-muted">Jatuh tempo</Text>
                        <Text className="text-label font-medium text-ink">
                          {dateShort(item.tanggal_jatuh_tempo)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      {isWali || SHOW_BAYAR_FOR_ALL ? (
        <Pressable
          onPress={() => setPilih(true)}
          style={{bottom: insets.bottom + 20}}
          className="absolute right-5 h-14 flex-row items-center rounded-full bg-brand px-5 shadow-lg active:opacity-80">
          <Wallet size={20} color={colors.brand.foreground} />
          <Text className="ml-2 text-label font-semibold text-brand-foreground">Bayar</Text>
        </Pressable>
      ) : null}

      <PilihTagihanSheet
        visible={pilih}
        filter={filter}
        onClose={() => setPilih(false)}
        onPick={t => {
          setPilih(false);
          setBayar(t);
        }}
      />

      <TagihanFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
