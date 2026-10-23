import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  SlidersHorizontal,
} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {DetailFilterSheet, currentMonth} from '../components/DetailFilterSheet';
import {MutabaahVariant, RekapParams, getDetail} from '../services/mutabaah.service';
import type {DetailSantri, KegiatanMutabaah, RekapSantri} from '../types';

const OK = '#059669';
const NO = '#DC2626';

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const dateLong = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** `santri` dari rekap ditampilkan langsung; rincian per hari dimuat dari API. */
export default function MutabaahSantriDetailScreen({
  santri,
  params,
  variant = 'santri',
  onBack,
}: {
  santri: RekapSantri;
  params: Pick<RekapParams, 'bulan'>;
  variant?: MutabaahVariant;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DetailSantri | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bulan, setBulan] = useState(() => params.bulan ?? currentMonth());
  const [sheet, setSheet] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await getDetail(variant, santri.id, {bulan});
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
      toast.error(detail ? `Gagal memuat detail (${detail})` : 'Gagal memuat detail mutabaah');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [variant, santri.id, bulan]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // kelompokkan per tanggal, terlama di kiri (prev) dan terbaru di kanan (next)
  const days = useMemo(() => {
    const map = new Map<string, KegiatanMutabaah[]>();
    (data?.kegiatan ?? []).forEach(k => map.set(k.tanggal, [...(map.get(k.tanggal) ?? []), k]));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  // data baru dimuat: mulai dari hari terakhir
  useEffect(() => {
    setDayIndex(Math.max(0, days.length - 1));
  }, [days]);

  const ringkasan = data?.ringkasan;
  const periode = data?.periode;
  const current = days[Math.min(dayIndex, days.length - 1)];

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="overflow-hidden bg-brand px-5 pb-5">
        <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
          </Pressable>
        </View>
        <View className="mt-3 flex-row items-center">
          <Avatar name={santri.nama} size={60} />
          <View className="ml-3 flex-1">
            <Text className="text-heading text-brand-foreground" numberOfLines={2}>
              {santri.nama}
            </Text>
            {santri.nomor_induk ? (
              <Text className="text-label text-brand-foreground opacity-80">
                NIS {santri.nomor_induk}
              </Text>
            ) : null}
          </View>
        </View>
        {periode ? (
          <Text className="mt-3 text-label text-brand-foreground opacity-80">
            Periode {dateShort(periode.tanggal_mulai)} – {dateShort(periode.tanggal_selesai)}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail mutabaah tidak dapat dimuat
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
        <ScrollView
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }>
          <View className="flex-row gap-3">
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Dikerjakan</Text>
              <Text className="mt-1 text-heading" style={{color: OK}}>
                {ringkasan?.dikerjakan ?? 0}
              </Text>
            </Card>
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Tidak dikerjakan</Text>
              <Text className="mt-1 text-heading" style={{color: NO}}>
                {ringkasan?.tidak_dikerjakan ?? 0}
              </Text>
            </Card>
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Capaian</Text>
              <Text className="mt-1 text-heading text-ink">{Math.round(ringkasan?.persentase ?? 0)}%</Text>
            </Card>
          </View>

          {!current ? (
            <View className="mt-10 items-center">
              <ClipboardCheck size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada data mutabaah</Text>
            </View>
          ) : (
            <View className="mt-5">
              <View className="mb-2 flex-row items-center justify-between">
                <Pressable
                  onPress={() => setDayIndex(i => i - 1)}
                  disabled={dayIndex <= 0}
                  hitSlop={10}
                  className="h-9 flex-row items-center rounded-full bg-surface pl-2 pr-3"
                  style={{opacity: dayIndex <= 0 ? 0.35 : 1}}
                  accessibilityLabel="Hari sebelumnya">
                  <ChevronLeft size={18} color={colors.brand.DEFAULT} />
                  <Text className="text-caption font-medium text-brand">Sebelumnya</Text>
                </Pressable>
                <View className="items-center">
                  <Text className="text-caption font-medium tracking-wide text-ink-muted">
                    {dateLong(current[0]).toUpperCase()}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {current[1].filter(k => k.dikerjakan).length}/{current[1].length} ·{' '}
                    hari {dayIndex + 1} dari {days.length}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setDayIndex(i => i + 1)}
                  disabled={dayIndex >= days.length - 1}
                  hitSlop={10}
                  className="h-9 flex-row items-center rounded-full bg-surface pl-3 pr-2"
                  style={{opacity: dayIndex >= days.length - 1 ? 0.35 : 1}}
                  accessibilityLabel="Hari berikutnya">
                  <Text className="text-caption font-medium text-brand">Selanjutnya</Text>
                  <ChevronRight size={18} color={colors.brand.DEFAULT} />
                </Pressable>
              </View>
              <Card className="border-0 px-4 py-1">
                {current[1].map((k, i) => (
                  <View key={k.id}>
                    {i > 0 ? <View className="h-px bg-line" /> : null}
                    <View className="flex-row items-start py-3">
                      {k.dikerjakan ? (
                        <CircleCheck size={20} color={OK} />
                      ) : (
                        <CircleX size={20} color={NO} />
                      )}
                      <View className="ml-3 flex-1">
                        <Text className="text-label font-medium text-ink">{k.indikator.nama}</Text>
                        {k.catatan ? (
                          <Text className="mt-0.5 text-caption text-ink-muted">{k.catatan}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </ScrollView>
      )}
      <DetailFilterSheet
        visible={sheet}
        value={bulan}
        onClose={() => setSheet(false)}
        onApply={setBulan}
      />
    </View>
  );
}
