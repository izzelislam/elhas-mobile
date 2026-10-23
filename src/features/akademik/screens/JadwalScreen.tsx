import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  User,
} from 'lucide-react-native';
import {ActiveFilterChips, FilterChip} from '@/components/ui/ActiveFilterChips';
import {Button} from '@/components/ui/Button';
import {getCachedReferensi} from '@/features/santri/services/referensi.service';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {
  EMPTY_JADWAL_FILTER,
  HARI,
  JadwalFilter,
  JadwalFilterSheet,
  hariLabel,
} from '../components/JadwalFilterSheet';
import JadwalDetailScreen from './JadwalDetailScreen';
import {JadwalPelajaran, getJadwalList} from '../services/jadwal.service';

const hhmm = (v: string) => v.slice(0, 5);
const todayIndex = () => (new Date().getDay() + 6) % 7; // 0 = Senin
const nowHHmm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};

export default function JadwalScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<JadwalPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<JadwalFilter>(EMPTY_JADWAL_FILTER);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<JadwalPelajaran | null>(null);
  const [day, setDay] = useState(todayIndex());
  const today = todayIndex();

  const load = useCallback(async () => {
    try {
      setItems(
        await getJadwalList({
          kelas_id: filter.kelasId ?? undefined,
          semester: filter.semester ?? undefined,
        }),
      );
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const countByDay = useMemo(() => {
    const c = HARI.map(() => 0);
    items.forEach(i => {
      const idx = HARI.indexOf(i.hari);
      if (idx >= 0) {
        c[idx]++;
      }
    });
    return c;
  }, [items]);

  const list = useMemo(
    () =>
      items
        .filter(i => i.hari === HARI[day])
        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
    [items, day],
  );

  const now = nowHHmm();
  const stateOf = (j: JadwalPelajaran): 'now' | 'next' | 'done' | 'idle' => {
    if (day !== today) {
      return 'idle';
    }
    if (hhmm(j.jam_selesai) <= now) {
      return 'done';
    }
    if (hhmm(j.jam_mulai) <= now) {
      return 'now';
    }
    return list.find(x => hhmm(x.jam_mulai) > now)?.id === j.id
      ? 'next'
      : 'idle';
  };

  const activeCount = (filter.kelasId ? 1 : 0) + (filter.semester ? 1 : 0);
  const chips: FilterChip[] = [];
  if (filter.kelasId) {
    chips.push({
      key: 'kelas',
      label:
        getCachedReferensi()?.kelas.find(k => k.id === filter.kelasId)?.nama ??
        'Kelas',
      onRemove: () => setFilter(f => ({...f, kelasId: null})),
    });
  }
  if (filter.semester) {
    chips.push({
      key: 'semester',
      label: `Semester ${hariLabel(filter.semester)}`,
      onRemove: () => setFilter(f => ({...f, semester: null})),
    });
  }
  const step = (d: number) => setDay(v => (v + d + 7) % 7);

  if (selected) {
    return (
      <JadwalDetailScreen jadwal={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-4"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">
            Jadwal Pelajaran
          </Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
      </View>

      <View className="bg-surface px-3 py-3">
        <View className="flex-row items-center justify-between px-2">
          <Pressable
            onPress={() => step(-1)}
            hitSlop={12}
            className="active:opacity-60"
          >
            <ChevronLeft size={26} color={colors.brand.DEFAULT} />
          </Pressable>
          <View className="items-center">
            <Text className="text-heading text-ink">
              {hariLabel(HARI[day])}
            </Text>
            <Text className="text-caption text-ink-muted">
              {day === today ? 'Hari ini · ' : ''}
              {countByDay[day]} pelajaran
            </Text>
          </View>
          <Pressable
            onPress={() => step(1)}
            hitSlop={12}
            className="active:opacity-60"
          >
            <ChevronRight size={26} color={colors.brand.DEFAULT} />
          </Pressable>
        </View>
        <View className="mt-3 flex-row justify-between">
          {HARI.map((h, i) => {
            const active = i === day;
            return (
              <Pressable
                key={h}
                onPress={() => setDay(i)}
                className={`h-12 w-11 items-center justify-center rounded-card ${
                  active ? 'bg-brand' : 'bg-field'
                }`}
              >
                <Text
                  className={`text-label font-semibold ${
                    active ? 'text-brand-foreground' : 'text-ink'
                  }`}
                >
                  {hariLabel(h).slice(0, 3)}
                </Text>
                <View
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    i === today
                      ? active
                        ? 'bg-brand-foreground'
                        : 'bg-brand'
                      : 'bg-transparent'
                  }`}
                />
              </Pressable>
            );
          })}
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
            Jadwal tidak dapat dimuat
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
          data={list}
          keyExtractor={j => String(j.id)}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              <CalendarClock size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                Tidak ada pelajaran hari {hariLabel(HARI[day])}
              </Text>
            </View>
          }
          renderItem={({item}) => {
            const st = stateOf(item);
            const highlight = st === 'now' || st === 'next';
            return (
              <Pressable
                onPress={() => setSelected(item)}
                className={`mb-3 flex-row overflow-hidden rounded-card bg-surface ${
                  st === 'done' ? 'opacity-50' : ''
                } ${
                  highlight ? 'border-2 border-brand' : ''
                } active:opacity-80`}
              >
                <View
                  className={`w-20 items-center justify-center py-4 ${
                    highlight ? 'bg-brand' : 'bg-brand-light'
                  }`}
                >
                  <Text
                    className={`text-body font-bold ${
                      highlight ? 'text-brand-foreground' : 'text-brand'
                    }`}
                  >
                    {hhmm(item.jam_mulai)}
                  </Text>
                  <Text
                    className={`text-caption ${
                      highlight ? 'text-brand-foreground' : 'text-ink-muted'
                    }`}
                  >
                    s/d {hhmm(item.jam_selesai)}
                  </Text>
                </View>
                <View className="flex-1 p-4">
                  {highlight ? (
                    <Text className="mb-1 text-caption font-bold uppercase text-brand">
                      {st === 'now' ? 'Sedang berlangsung' : 'Berikutnya'}
                    </Text>
                  ) : null}
                  <Text
                    className="text-body font-semibold text-ink"
                    numberOfLines={2}
                  >
                    {item.mata_pelajaran?.nama ?? '-'}
                  </Text>
                  <Text
                    className="mt-1 text-label font-medium text-ink"
                    numberOfLines={1}
                  >
                    {item.kelas?.nama ?? '-'}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    <User size={12} color={colors.text.muted} />
                    <Text
                      className="ml-1 text-caption text-ink-muted"
                      numberOfLines={1}
                    >
                      {item.ustadz?.name ?? '-'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <JadwalFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
