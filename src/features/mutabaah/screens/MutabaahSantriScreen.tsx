import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ClipboardCheck, Plus, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {
  EMPTY_REKAP_FILTER,
  RekapFilter,
  RekapFilterSheet,
} from '../components/RekapFilterSheet';
import {RekapParams, getRekapSantri} from '../services/mutabaahSantri.service';
import type {RekapResponse, RekapSantri} from '../types';

type Rekap = RekapResponse['data'];

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const percentColor = (item: RekapSantri) =>
  item.total === 0
    ? '#6B7280'
    : item.persentase >= 80
    ? '#059669'
    : item.persentase >= 50
    ? '#D97706'
    : '#DC2626';

function RekapItem({item, onPress}: {item: RekapSantri; onPress: () => void}) {
  const c = percentColor(item);
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-3 border-0 p-4">
      <View className="flex-row items-center">
        <Avatar name={item.nama} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-body font-semibold text-ink" numberOfLines={1}>
            {item.nama}
          </Text>
          <Text className="text-caption text-ink-muted">NIS {item.nomor_induk}</Text>
        </View>
        <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
          <Text style={{color: c}} className="text-caption font-semibold">
            {item.total === 0 ? 'Belum ada data' : `${Math.round(item.persentase)}%`}
          </Text>
        </View>
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-field">
        <View
          style={{width: `${Math.min(100, Math.max(0, item.persentase))}%`, backgroundColor: c}}
          className="h-full rounded-full"
        />
      </View>
      <View className="mt-3 flex-row">
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Dikerjakan</Text>
          <Text className="text-label font-semibold text-ink">{item.dikerjakan}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Tidak dikerjakan</Text>
          <Text className="text-label font-semibold text-ink">{item.tidak_dikerjakan}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Total</Text>
          <Text className="text-label font-semibold text-ink">{item.total}</Text>
        </View>
      </View>
    </Card>
    </Pressable>
  );
}

export default function MutabaahSantriScreen({
  onBack,
  onCreate,
  onSelect,
}: {
  onBack: () => void;
  onCreate: () => void;
  onSelect: (item: RekapSantri, params: Omit<RekapParams, 'santri_id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Rekap | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RekapFilter>(EMPTY_REKAP_FILTER);
  const [sheet, setSheet] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await getRekapSantri({
        santri_id: filter.santri?.id,
        bulan: filter.bulan ?? undefined,
        tanggal_mulai: filter.tanggalMulai ?? undefined,
        tanggal_selesai: filter.tanggalSelesai ?? undefined,
      });
      if (id !== requestId.current) {
        return;
      }
      setData(res);
      setFailed(false);
    } catch (err) {
      if (id !== requestId.current) {
        return;
      }
      setFailed(true);
      const detail = describeError(err);
      console.warn('Rekap mutabaah gagal', err);
      toast.error(detail ? `Gagal memuat rekap mutabaah (${detail})` : 'Gagal memuat rekap mutabaah');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      (data?.rekap ?? []).filter(r => !query || r.nama.toLowerCase().includes(query)),
    [data, query],
  );
  const activeCount =
    (filter.santri ? 1 : 0) +
    (filter.bulan ? 1 : 0) +
    (filter.tanggalMulai ? 1 : 0) +
    (filter.tanggalSelesai ? 1 : 0);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Mutabaah Santri</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {data ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            Periode {dateShort(data.periode.tanggal_mulai)} – {dateShort(data.periode.tanggal_selesai)}
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
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Rekap mutabaah tidak dapat dimuat
          </Text>
          <Button
            title="Coba lagi"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => String(r.id)}
          renderItem={({item}) => <RekapItem
              item={item}
              onPress={() =>
                onSelect(item, {
                  bulan: filter.bulan ?? undefined,
                  tanggal_mulai: filter.tanggalMulai ?? undefined,
                  tanggal_selesai: filter.tanggalSelesai ?? undefined,
                })
              }
            />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 96}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListHeaderComponent={
            <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
              REKAP · {rows.length} SANTRI{activeCount > 0 ? ' (TERFILTER)' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <ClipboardCheck size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada data mutabaah'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={onCreate}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Input mutabaah">
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
      <RekapFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
