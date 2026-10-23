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
  FileText,
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
  EMPTY_RAPOR_FILTER,
  RaporFilter,
  RaporFilterSheet,
} from '../components/RaporFilterSheet';
import {Rapor, getRaporList, raporStatus} from '../services/rapor.service';
import RaporDetailScreen from './RaporDetailScreen';

const PER_PAGE = 15;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function RaporScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Rapor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RaporFilter>(EMPTY_RAPOR_FILTER);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Rapor | null>(null);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getRaporList({
          page: target,
          per_page: PER_PAGE,
          santri_id: filter.santri?.id,
          tahun_ajaran_id: filter.tahunAjaranId ?? undefined,
          kelas_id: filter.kelasId ?? undefined,
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
        toast.error('Gagal memuat rapor');
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

  const activeCount =
    (filter.santri ? 1 : 0) +
    (filter.tahunAjaranId ? 1 : 0) +
    (filter.kelasId ? 1 : 0);

  const chips: FilterChip[] = [];
  if (filter.santri) {
    chips.push({
      key: 'santri',
      label: filter.santri.nama,
      onRemove: () => setFilter(f => ({...f, santri: null})),
    });
  }
  if (filter.tahunAjaranId) {
    const t = items.find(r => r.tahun_ajaran_id === filter.tahunAjaranId)
      ?.tahun_ajaran?.nama;
    chips.push({
      key: 'tahun',
      label: t ? `TA ${t}` : 'Tahun ajaran',
      onRemove: () => setFilter(f => ({...f, tahunAjaranId: null})),
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

  if (selected) {
    return (
      <RaporDetailScreen rapor={selected} onBack={() => setSelected(null)} />
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
            Rapor
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
            {total} rapor{activeCount > 0 ? ' (terfilter)' : ''}
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
            Data rapor tidak dapat dimuat
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
          keyExtractor={r => String(r.id)}
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
              <FileText size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada rapor'}
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
            const st = raporStatus(item.status);
            return (
              <Pressable
                onPress={() => setSelected(item)}
                className="active:opacity-80"
              >
                <Card className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Avatar
                      name={item.santri?.nama_lengkap}
                      uri={item.santri?.foto ?? undefined}
                      size={44}
                    />
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-body font-semibold text-ink"
                        numberOfLines={1}
                      >
                        {item.santri?.nama_lengkap ?? '-'}
                      </Text>
                      <Text className="text-caption text-ink-muted">
                        NIS {item.santri?.nis ?? '-'}
                      </Text>
                    </View>
                    <View
                      style={{backgroundColor: st.color + '1A'}}
                      className="ml-2 rounded-full px-2.5 py-1"
                    >
                      <Text
                        style={{color: st.color}}
                        className="text-caption font-semibold"
                      >
                        {st.label}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row border-t border-line pt-3">
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Kelas</Text>
                      <Text
                        className="text-label font-medium text-ink"
                        numberOfLines={1}
                      >
                        {item.kelas?.nama ?? '-'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">
                        Periode
                      </Text>
                      <Text
                        className="text-label font-medium text-ink"
                        numberOfLines={1}
                      >
                        {item.tahun_ajaran?.nama ?? '-'} · {cap(item.semester)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      <RaporFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
