import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import {ActiveFilterChips, FilterChip} from '@/components/ui/ActiveFilterChips';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {getCachedReferensi} from '@/features/santri/services/referensi.service';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {
  AbsensiFilter,
  AbsensiFilterSheet,
  defaultAbsensiFilter,
  todayKey,
} from '../components/AbsensiFilterSheet';
import AbsensiStatistikScreen from './AbsensiStatistikScreen';
import AbsensiFormScreen from './AbsensiFormScreen';
import {Absensi, getAbsensiList} from '../services/absensi.service';

const PER_PAGE = 15;

const STATUS: Record<string, string> = {
  hadir: '#059669',
  sakit: '#D97706',
  izin: '#2563EB',
  alpha: '#DC2626',
};
const statusColor = (v: string) => STATUS[v] ?? colors.brand.DEFAULT;

const dateLong = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function AbsensiScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Absensi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AbsensiFilter>(defaultAbsensiFilter);
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState(false);
  const [statistik, setStatistik] = useState(false);
  const [version, setVersion] = useState(0);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getAbsensiList({
          page: target,
          per_page: PER_PAGE,
          santri_id: filter.santri?.id,
          kelas_id: filter.kelasId ?? undefined,
          tanggal: filter.tanggal ?? undefined,
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
        toast.error('Gagal memuat absensi');
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

  const activeCount =
    (filter.santri ? 1 : 0) +
    (filter.kelasId ? 1 : 0) +
    (filter.tanggal && filter.tanggal !== todayKey() ? 1 : 0);

  const shiftDay = (delta: number) =>
    setFilter(f => {
      if (!f.tanggal) {
        return f;
      }
      const d = new Date(f.tanggal + 'T00:00:00');
      d.setDate(d.getDate() + delta);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(d.getDate()).padStart(2, '0')}`;
      return key > todayKey() ? f : {...f, tanggal: key};
    });

  const chips: FilterChip[] = [];
  if (filter.santri) {
    chips.push({
      key: 'santri',
      label: filter.santri.nama,
      onRemove: () => setFilter(f => ({...f, santri: null})),
    });
  }
  if (filter.kelasId) {
    const nama = getCachedReferensi()?.kelas.find(
      k => k.id === filter.kelasId,
    )?.nama;
    chips.push({
      key: 'kelas',
      label: nama ?? 'Kelas',
      onRemove: () => setFilter(f => ({...f, kelasId: null})),
    });
  }

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query
        ? items.filter(i =>
            i.santri?.nama_lengkap.toLowerCase().includes(query),
          )
        : items,
    [items, query],
  );

  if (statistik) {
    return <AbsensiStatistikScreen onBack={() => setStatistik(false)} />;
  }
  if (form) {
    return (
      <AbsensiFormScreen
        onBack={() => setForm(false)}
        onSaved={() => {
          setForm(false);
          setVersion(v => v + 1);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">
            Absensi
          </Text>
          <Pressable
            onPress={() => setStatistik(true)}
            hitSlop={10}
            className="mr-4"
          >
            <BarChart3 size={22} color={colors.brand.foreground} />
          </Pressable>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} absensi{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
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

      <View className="flex-row items-center justify-between bg-surface px-5 pb-3">
        <Pressable
          onPress={() => shiftDay(-1)}
          disabled={!filter.tanggal}
          hitSlop={10}
          className={`h-10 flex-row items-center rounded-full bg-field pl-2 pr-3 ${
            filter.tanggal ? 'active:opacity-70' : 'opacity-40'
          }`}
        >
          <ChevronLeft size={18} color={colors.brand.DEFAULT} />
          <Text className="text-label font-medium text-brand">Sebelumnya</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter(f => ({...f, tanggal: todayKey()}))}
          className="items-center px-2"
        >
          <Text className="text-label font-semibold text-ink">
            {filter.tanggal
              ? new Date(filter.tanggal + 'T00:00:00').toLocaleDateString(
                  'id-ID',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  },
                )
              : 'Semua tanggal'}
          </Text>
          <Text className="text-caption text-ink-muted">
            {filter.tanggal === todayKey()
              ? 'Hari ini'
              : 'Ketuk untuk hari ini'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => shiftDay(1)}
          disabled={!filter.tanggal || filter.tanggal >= todayKey()}
          hitSlop={10}
          className={`h-10 flex-row items-center rounded-full bg-field pl-3 pr-2 ${
            filter.tanggal && filter.tanggal < todayKey()
              ? 'active:opacity-70'
              : 'opacity-40'
          }`}
        >
          <Text className="text-label font-medium text-brand">Selanjutnya</Text>
          <ChevronRight size={18} color={colors.brand.DEFAULT} />
        </Pressable>
      </View>

      <ActiveFilterChips chips={chips} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Data absensi tidak dapat dimuat
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
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              <CalendarCheck size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada absensi'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                className="py-4"
                color={colors.brand.DEFAULT}
              />
            ) : undefined
          }
          renderItem={({item}) => {
            const c = statusColor(item.status.value);
            return (
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <Avatar name={item.santri?.nama_lengkap} size={44} />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-body font-semibold text-ink"
                      numberOfLines={1}
                    >
                      {item.santri?.nama_lengkap ?? '-'}
                    </Text>
                    <Text
                      className="text-caption text-ink-muted"
                      numberOfLines={1}
                    >
                      {item.kelas?.nama ?? '-'}
                    </Text>
                  </View>
                  <View
                    style={{backgroundColor: c + '1A'}}
                    className="ml-2 rounded-full px-2.5 py-1"
                  >
                    <Text
                      style={{color: c}}
                      className="text-caption font-semibold"
                    >
                      {item.status.label}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between border-t border-line pt-3">
                  <Text className="text-label text-ink">
                    {dateLong(item.tanggal)}
                  </Text>
                  <Text className="text-caption uppercase text-ink-muted">
                    {item.jenis}
                  </Text>
                </View>
                {item.keterangan ? (
                  <Text className="mt-2 text-label text-ink-muted">
                    {item.keterangan}
                  </Text>
                ) : null}
                {item.pencatat ? (
                  <Text className="mt-2 text-caption text-ink-muted">
                    Dicatat oleh {item.pencatat.name}
                  </Text>
                ) : null}
              </Card>
            );
          }}
        />
      )}
      <Pressable
        onPress={() => setForm(true)}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Input absensi"
      >
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
      <AbsensiFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
