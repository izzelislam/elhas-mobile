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
  Award,
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
  EMPTY_NILAI_FILTER,
  NilaiFilter,
  NilaiFilterSheet,
  jenisLabel,
} from '../components/NilaiFilterSheet';
import NilaiDetailScreen from './NilaiDetailScreen';
import NilaiFormScreen from './NilaiFormScreen';
import {getCachedMataPelajaran} from '../services/jadwal.service';
import {Nilai, getNilaiList} from '../services/nilai.service';

const PER_PAGE = 15;

const scoreColor = (n: number) =>
  n >= 80 ? '#059669' : n >= 70 ? '#2563EB' : n >= 60 ? '#D97706' : '#DC2626';

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function NilaiScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Nilai[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NilaiFilter>(EMPTY_NILAI_FILTER);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Nilai | null>(null);
  const [form, setForm] = useState(false);
  const [version, setVersion] = useState(0);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getNilaiList({
          page: target,
          per_page: PER_PAGE,
          santri_id: filter.santri?.id,
          unit_id: filter.unitId ?? undefined,
          kelas_id: filter.kelasId ?? undefined,
          tahun_ajaran_id: filter.tahunAjaranId ?? undefined,
          mata_pelajaran_id: filter.mapelId ?? undefined,
          jenis: filter.jenis ?? undefined,
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
        toast.error('Gagal memuat nilai');
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
    (filter.unitId ? 1 : 0) +
    (filter.kelasId ? 1 : 0) +
    (filter.tahunAjaranId ? 1 : 0) +
    (filter.mapelId ? 1 : 0) +
    (filter.jenis ? 1 : 0);

  const chips: FilterChip[] = [];
  if (filter.santri) {
    chips.push({
      key: 'santri',
      label: filter.santri.nama,
      onRemove: () => setFilter(f => ({...f, santri: null})),
    });
  }
  if (filter.unitId) {
    chips.push({
      key: 'unit',
      label:
        getCachedReferensi()?.units.find(u => u.id === filter.unitId)?.nama ??
        'Unit',
      onRemove: () => setFilter(f => ({...f, unitId: null})),
    });
  }
  if (filter.kelasId) {
    chips.push({
      key: 'kelas',
      label:
        getCachedReferensi()?.kelas.find(k => k.id === filter.kelasId)?.nama ??
        'Kelas',
      onRemove: () => setFilter(f => ({...f, kelasId: null})),
    });
  }
  if (filter.tahunAjaranId) {
    const t = items.find(n => n.tahun_ajaran_id === filter.tahunAjaranId)
      ?.tahun_ajaran?.nama;
    chips.push({
      key: 'tahun',
      label: t ? `TA ${t}` : 'Tahun ajaran',
      onRemove: () => setFilter(f => ({...f, tahunAjaranId: null})),
    });
  }
  if (filter.mapelId) {
    chips.push({
      key: 'mapel',
      label:
        getCachedMataPelajaran()?.find(m => m.id === filter.mapelId)?.nama ??
        'Mata pelajaran',
      onRemove: () => setFilter(f => ({...f, mapelId: null})),
    });
  }
  if (filter.jenis) {
    chips.push({
      key: 'jenis',
      label: jenisLabel(filter.jenis),
      onRemove: () => setFilter(f => ({...f, jenis: null})),
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

  if (form) {
    return (
      <NilaiFormScreen
        onBack={() => setForm(false)}
        onSaved={() => {
          setForm(false);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (selected) {
    return (
      <NilaiDetailScreen nilai={selected} onBack={() => setSelected(null)} />
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
            Nilai
          </Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} nilai{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
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
      <ActiveFilterChips chips={chips} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Data nilai tidak dapat dimuat
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
          keyExtractor={n => String(n.id)}
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
              <Award size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada nilai'}
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
            const c = scoreColor(item.nilai);
            return (
              <Pressable
                onPress={() => setSelected(item)}
                className="active:opacity-80"
              >
                <Card className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Avatar name={item.santri?.nama_lengkap} size={40} />
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-label font-semibold text-ink"
                        numberOfLines={1}
                      >
                        {item.santri?.nama_lengkap ?? '-'}
                      </Text>
                      <Text className="text-caption text-ink-muted">
                        NIS {item.santri?.nis ?? '-'}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row items-center border-t border-line pt-3">
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-body font-semibold text-ink"
                        numberOfLines={2}
                      >
                        {item.mata_pelajaran?.nama ?? '-'}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <View className="rounded-full bg-field px-2.5 py-0.5">
                          <Text className="text-caption font-semibold text-ink-muted">
                            {jenisLabel(item.jenis)}
                          </Text>
                        </View>
                        <Text
                          className="ml-2 flex-1 text-caption text-ink-muted"
                          numberOfLines={1}
                        >
                          {item.tahun_ajaran?.nama ?? ''} · {cap(item.semester)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{backgroundColor: c + '1A'}}
                      className="h-14 w-14 items-center justify-center rounded-card"
                    >
                      <Text
                        style={{color: c}}
                        className="text-heading font-bold"
                      >
                        {item.nilai}
                      </Text>
                    </View>
                  </View>
                  {item.catatan ? (
                    <Text className="mt-2 text-label text-ink-muted">
                      {item.catatan}
                    </Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      <Pressable
        onPress={() => setForm(true)}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Input nilai"
      >
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
      <NilaiFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
