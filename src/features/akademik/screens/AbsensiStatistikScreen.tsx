import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CalendarDays, SlidersHorizontal} from 'lucide-react-native';
import {ActiveFilterChips, FilterChip} from '@/components/ui/ActiveFilterChips';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {Card} from '@/components/ui/Card';
import {DonutChart} from '@/components/ui/DonutChart';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {
  Kelas,
  getCachedReferensi,
  loadReferensi,
} from '@/features/santri/services/referensi.service';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {todayKey} from '../components/AbsensiFilterSheet';
import {RekapAbsensi, getRekapAbsensi} from '../services/absensi.service';

const STATUS = [
  {key: 'hadir', label: 'Hadir', color: '#059669'},
  {key: 'sakit', label: 'Sakit', color: '#D97706'},
  {key: 'izin', label: 'Izin', color: '#2563EB'},
  {key: 'alpha', label: 'Alpha', color: '#DC2626'},
] as const;

type Range = {mulai: string; selesai: string};
type Filter = {kelasId: number | null; range: Range};

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

const PRESETS: {id: string; label: string; range: () => Range}[] = [
  {
    id: 'hari',
    label: 'Hari ini',
    range: () => ({mulai: todayKey(), selesai: todayKey()}),
  },
  {
    id: 'minggu',
    label: '7 hari',
    range: () => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return {mulai: key(d), selesai: todayKey()};
    },
  },
  {
    id: 'bulan',
    label: 'Bulan ini',
    range: () => {
      const d = new Date();
      return {
        mulai: key(new Date(d.getFullYear(), d.getMonth(), 1)),
        selesai: todayKey(),
      };
    },
  },
];

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const pct = (n: number, total: number) =>
  total > 0 ? Math.round((n / total) * 100) : 0;

function FilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: Filter;
  onClose: () => void;
  onApply: (f: Filter) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'mulai' | 'selesai'>('main');
  const [kelas, setKelas] = useState<Kelas[]>(
    getCachedReferensi()?.kelas ?? [],
  );

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  useEffect(() => {
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => setKelas(ref.kelas))
        .catch(() => {});
    }
  }, []);

  const options = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua kelas'}].concat(
        kelas.map(k => ({value: k.id, label: k.nama})),
      ),
    [kelas],
  );

  const picking = page !== 'main';

  return (
    <BottomSheet
      visible={visible}
      title={
        picking
          ? page === 'mulai'
            ? 'Dari Tanggal'
            : 'Sampai Tanggal'
          : 'Filter'
      }
      onClose={onClose}
    >
      {picking ? (
        <View className="pb-2">
          <Pressable
            onPress={() => setPage('main')}
            hitSlop={10}
            className="mb-3 flex-row items-center self-start"
          >
            <ArrowLeft size={16} color={colors.brand.DEFAULT} />
            <Text className="ml-1 text-label font-medium text-brand">
              Kembali
            </Text>
          </Pressable>
          <CalendarPicker
            value={draft.range[page]}
            maxDate={page === 'mulai' ? draft.range.selesai : todayKey()}
            onChange={t => {
              setDraft(d => ({...d, range: {...d.range, [page]: t}}));
              setPage('main');
            }}
          />
        </View>
      ) : (
        <>
          <View className="gap-4 pb-1">
            <Select<number | null>
              label="Kelas"
              placeholder="Semua kelas"
              value={draft.kelasId}
              onChange={kelasId => setDraft(d => ({...d, kelasId}))}
              options={options}
            />
            <PickerField
              icon={CalendarDays}
              label="Dari tanggal"
              value={dateShort(draft.range.mulai)}
              placeholder="Pilih tanggal"
              onPress={() => setPage('mulai')}
              onClear={() => setPage('mulai')}
            />
            <PickerField
              icon={CalendarDays}
              label="Sampai tanggal"
              value={dateShort(draft.range.selesai)}
              placeholder="Pilih tanggal"
              onPress={() => setPage('selesai')}
              onClear={() => setPage('selesai')}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => {
                  onApply(defaultFilter());
                  onClose();
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Terapkan"
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
              />
            </View>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const defaultFilter = (): Filter => ({
  kelasId: null,
  range: PRESETS[2].range(),
});

export default function AbsensiStatistikScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const [data, setData] = useState<RekapAbsensi | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await getRekapAbsensi({
          kelas_id: filter.kelasId ?? undefined,
          tanggal_mulai: filter.range.mulai,
          tanggal_selesai: filter.range.selesai,
          per_page: 100,
        }),
      );
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat statistik absensi');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const activePreset = PRESETS.find(p => {
    const r = p.range();
    return r.mulai === filter.range.mulai && r.selesai === filter.range.selesai;
  });

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

  const total = data?.total ?? 0;
  const hadir = data?.status.hadir ?? 0;

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
            Statistik Absensi
          </Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
          </Pressable>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          {filter.range.mulai === filter.range.selesai
            ? dateShort(filter.range.mulai)
            : `${dateShort(filter.range.mulai)} – ${dateShort(
                filter.range.selesai,
              )}`}
        </Text>
      </View>

      <View className="flex-row gap-2 bg-surface px-5 py-3">
        {PRESETS.map(p => {
          const active = activePreset?.id === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setFilter(f => ({...f, range: p.range()}))}
              className={`h-10 items-center justify-center rounded-full px-4 ${
                active ? 'bg-brand' : 'bg-field'
              }`}
            >
              <Text
                className={`text-label font-medium ${
                  active ? 'text-brand-foreground' : 'text-ink-muted'
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ActiveFilterChips chips={chips} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Statistik tidak dapat dimuat
          </Text>
          <Button title="Coba lagi" onPress={load} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {total === 0 ? (
            <Text className="mt-16 text-center text-body text-ink-muted">
              Belum ada data absensi pada periode ini
            </Text>
          ) : (
            <>
              <Card className="border-0 p-5">
                <DonutChart
                  data={STATUS.map(s => ({
                    key: s.key,
                    label: s.label,
                    color: s.color,
                    value: data.status[s.key] ?? 0,
                  }))}
                  selected={selected}
                  onSelect={setSelected}
                  centerValue={`${pct(hadir, total)}%`}
                  centerLabel="Kehadiran"
                />
                <Text className="mt-3 text-center text-caption text-ink-muted">
                  {hadir} hadir dari {total} data · ketuk grafik untuk detail
                </Text>
                <View className="mt-4">
                  {STATUS.map(s => {
                    const n = data.status[s.key] ?? 0;
                    const on = selected === s.key;
                    return (
                      <Pressable
                        key={s.key}
                        onPress={() => setSelected(on ? null : s.key)}
                        style={
                          on ? {backgroundColor: s.color + '1A'} : undefined
                        }
                        className="flex-row items-center rounded-card px-3 py-3 active:opacity-70"
                      >
                        <View
                          style={{backgroundColor: s.color}}
                          className="h-3 w-3 rounded-full"
                        />
                        <Text className="ml-3 flex-1 text-body text-ink">
                          {s.label}
                        </Text>
                        <Text className="text-body font-semibold text-ink">
                          {n}
                        </Text>
                        <Text className="w-14 text-right text-label text-ink-muted">
                          {pct(n, total)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {data.per_kelas.length > 1 || !filter.kelasId ? (
                <Card className="mt-3 border-0 p-4">
                  <Text className="mb-1 text-body font-semibold text-ink">
                    Per kelas
                  </Text>
                  {data.per_kelas.map(k => {
                    const p = pct(Number(k.hadir), k.total);
                    return (
                      <View key={k.kelas_id} className="mt-3">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="flex-1 text-label text-ink"
                            numberOfLines={1}
                          >
                            {k.kelas?.nama ?? `Kelas ${k.kelas_id}`}
                          </Text>
                          <Text className="ml-2 text-label font-semibold text-ink">
                            {p}%
                          </Text>
                        </View>
                        <View className="mt-1 h-2 overflow-hidden rounded-full bg-field">
                          <View
                            style={{
                              width: `${p}%`,
                              backgroundColor: STATUS[0].color,
                            }}
                            className="h-2 rounded-full"
                          />
                        </View>
                        <Text className="mt-0.5 text-caption text-ink-muted">
                          {Number(k.hadir)} hadir dari {k.total}
                        </Text>
                      </View>
                    );
                  })}
                </Card>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
      <FilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
