import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpenCheck, Search, SlidersHorizontal, Users, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getHalaqahList} from '../services/halaqah.service';
import {
  EMPTY_RINGKASAN_FILTER,
  RingkasanFilter,
  RingkasanFilterSheet,
} from '../components/RingkasanFilterSheet';
import {getRingkasan} from '../services/ringkasan.service';
import type {Ringkasan, RingkasanSantri} from '../types';

type Sort = 'terbanyak' | 'terbaru';

const SORTS: {value: Sort; label: string}[] = [
  {value: 'terbanyak', label: 'Setoran terbanyak'},
  {value: 'terbaru', label: 'Setoran terbaru'},
];

const RANK_COLOR = ['#D97706', '#6B7280', '#B45309'];

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex-1 border-0 p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light">
        <Icon size={18} color={colors.brand.DEFAULT} />
      </View>
      <Text className="mt-3 text-heading text-ink">{value.toLocaleString('id-ID')}</Text>
      <Text className="text-caption text-ink-muted">{label}</Text>
    </Card>
  );
}

function Row({
  item,
  rank,
  onPress,
}: {
  item: RingkasanSantri;
  rank: number;
  onPress: () => void;
}) {
  const top = rank <= 3 && RANK_COLOR[rank - 1];
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-2 flex-row items-center border-0 px-3 py-3">
      <View
        style={top ? {backgroundColor: top + '1A'} : undefined}
        className="h-7 w-7 items-center justify-center rounded-full">
        <Text
          style={top ? {color: top} : undefined}
          className="text-caption font-semibold text-ink-muted">
          {rank}
        </Text>
      </View>
      <View className="ml-2">
        <Avatar name={item.santri?.nama_lengkap} size={40} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-label font-semibold text-ink" numberOfLines={1}>
          {item.santri?.nama_lengkap ?? '-'}
        </Text>
        <Text className="text-caption text-ink-muted" numberOfLines={1}>
          {item.terakhir_setoran
            ? `Terakhir ${dateShort(item.terakhir_setoran)}`
            : 'Belum pernah setor'}
        </Text>
      </View>
      <View className="ml-2 items-center rounded-full bg-brand-light px-3 py-1">
        <Text className="text-label font-semibold text-brand">{item.jumlah_setoran}</Text>
        <Text className="text-[10px] text-brand">setoran</Text>
      </View>
    </Card>
    </Pressable>
  );
}

export default function RingkasanScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (item: RingkasanSantri) => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Ringkasan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('terbanyak');
  const [filter, setFilter] = useState<RingkasanFilter>(EMPTY_RINGKASAN_FILTER);
  const [sheet, setSheet] = useState(false);
  const [halaqahOptions, setHalaqahOptions] = useState<{id: number; nama: string}[]>([]);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await getRingkasan({
        halaqah_id: filter.halaqahId ?? undefined,
        tanggal_mulai: filter.tanggalMulai ?? undefined,
        tanggal_selesai: filter.tanggalSelesai ?? undefined,
      });
      if (id !== requestId.current) {
        return;
      }
      setData(res);
      setFailed(false);
    } catch {
      if (id !== requestId.current) {
        return;
      }
      setFailed(true);
      toast.error('Gagal memuat ringkasan');
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

  useEffect(() => {
    getHalaqahList()
      .then(list => setHalaqahOptions(list.map(h => ({id: h.id, nama: h.nama}))))
      .catch(() => {}); // filter halaqah kosong bila gagal; ringkasan tetap berfungsi
  }, []);

  const activeCount =
    (filter.halaqahId !== null ? 1 : 0) +
    (filter.tanggalMulai ? 1 : 0) +
    (filter.tanggalSelesai ? 1 : 0);

  const query = search.trim().toLowerCase();
  const rows = useMemo(() => {
    const list = [...(data?.per_santri ?? [])];
    list.sort((a, b) =>
      sort === 'terbanyak'
        ? b.jumlah_setoran - a.jumlah_setoran ||
          (b.terakhir_setoran ?? '').localeCompare(a.terakhir_setoran ?? '')
        : (b.terakhir_setoran ?? '').localeCompare(a.terakhir_setoran ?? ''),
    );
    // peringkat mengikuti urutan penuh, bukan hasil pencarian
    const ranked = list.map((item, i) => ({item, rank: i + 1}));
    return query
      ? ranked.filter(r => r.item.santri?.nama_lengkap.toLowerCase().includes(query))
      : ranked;
  }, [data, sort, query]);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Ringkasan Hafalan</Text>
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
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Ringkasan tidak dapat dimuat
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
          keyExtractor={r => String(r.item.santri_id)}
          renderItem={({item: r}) => <Row item={r.item} rank={r.rank} onPress={() => onSelect(r.item)} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListHeaderComponent={
            <View className="mb-2">
              <View className="flex-row gap-3">
                <Stat icon={BookOpenCheck} label="Total setoran" value={data.total_setoran} />
                <Stat icon={Users} label="Santri aktif setor" value={data.santri_aktif_setoran} />
              </View>
              <View className="mb-1 mt-4 flex-row gap-2">
                {SORTS.map(s => {
                  const active = s.value === sort;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => setSort(s.value)}
                      className={`rounded-full px-4 py-1.5 ${
                        active ? 'bg-brand' : 'bg-brand-light'
                      }`}>
                      <Text
                        className={`text-label font-medium ${
                          active ? 'text-brand-foreground' : 'text-brand'
                        }`}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mb-1 ml-1 mt-3 text-caption font-medium tracking-wide text-ink-muted">
                PER SANTRI · {rows.length}{activeCount > 0 ? ' (TERFILTER)' : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="mt-10 text-center text-body text-ink-muted">
              {query ? 'Santri tidak ditemukan' : 'Belum ada data setoran'}
            </Text>
          }
        />
      )}
      <RingkasanFilterSheet
        visible={sheet}
        value={filter}
        halaqahOptions={halaqahOptions}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
