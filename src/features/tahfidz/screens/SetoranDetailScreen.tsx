import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpen, ChevronLeft, ChevronRight} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {MonthPicker} from '@/components/ui/MonthPicker';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {JENIS, KUALITAS, ayatRange} from '../components/SetoranItem';
import {getHafalanSantri} from '../services/setoran.service';
import type {DetailHafalanSantri, Setoran} from '../types';

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const monthLabel = (v: string) =>
  new Date(v + '-01T00:00:00').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});

const monthOf = (tanggal: string) => tanggal.slice(0, 7);

/** 1 juz = 10 lembar (20 halaman), mis. 1,3 juz menjadi "1 juz 3 lembar". */
const juzLembar = (n: number) => {
  const total = Math.round(n * 10);
  if (total === 0) {
    return n > 0 ? '< 1 lembar' : '0 lembar';
  }
  const j = Math.floor(total / 10);
  const l = total % 10;
  return [j ? `${j} juz` : null, l ? `${l} lembar` : null].filter(Boolean).join(' ');
};

function Chip({label, color}: {label: string; color: string}) {
  return (
    <View style={{backgroundColor: color + '1A'}} className="rounded-full px-2.5 py-0.5">
      <Text style={{color}} className="text-caption font-medium">
        {label}
      </Text>
    </View>
  );
}

function SetoranRow({item}: {item: Setoran}) {
  const halaman =
    item.halaman_mulai != null
      ? item.halaman_mulai === item.halaman_selesai || item.halaman_selesai == null
        ? `Hal. ${item.halaman_mulai}`
        : `Hal. ${item.halaman_mulai}–${item.halaman_selesai}`
      : null;
  return (
    <Card className="mb-3 border-0 p-4">
      <Text className="text-caption text-ink-muted">{dateShort(item.tanggal)}</Text>
      <Text className="mt-1 text-body font-semibold text-ink">{ayatRange(item)}</Text>
      {halaman ? <Text className="text-caption text-ink-muted">{halaman}</Text> : null}
      {item.catatan ? <Text className="mt-2 text-label text-ink-muted">{item.catatan}</Text> : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-2 border-t border-line pt-3">
        <Chip label={item.jenis.label} color={JENIS[item.jenis.value] ?? colors.brand.DEFAULT} />
        <Chip
          label={item.kualitas.label.split(' (')[0]}
          color={KUALITAS[item.kualitas.value] ?? colors.brand.DEFAULT}
        />
        {item.ustadz ? (
          <Text className="ml-auto text-caption text-ink-muted" numberOfLines={1}>
            {item.ustadz.name}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/** `item` hanya dipakai untuk mengenali santri dan bulan awal; target dan setoran bulanan dimuat dari API. */
export default function SetoranDetailScreen({item, onBack}: {item: Setoran; onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const santriId = item.santri?.id;
  const [bulan, setBulan] = useState(() => monthOf(item.tanggal)); // YYYY-MM
  const [data, setData] = useState<DetailHafalanSantri | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (santriId == null) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    try {
      const res = await getHafalanSantri(santriId, {
        tahun: parseInt(bulan.slice(0, 4), 10),
        bulan: parseInt(bulan.slice(5, 7), 10),
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
      toast.error(detail ? `Gagal memuat detail (${detail})` : 'Gagal memuat detail hafalan');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [santriId, bulan]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const santri = data?.santri ?? item.santri;
  const target = data?.target_aktif;
  const progress = target && target.target_juz > 0 ? target.tercapai_juz / target.target_juz : 0;

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="items-center overflow-hidden bg-brand px-5 pb-5">
        <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
        <View className="absolute -left-16 top-20 h-36 w-36 rounded-icon bg-white/10" />
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <View className="mt-1">
          <Avatar name={santri?.nama_lengkap} size={72} />
        </View>
        <Text className="mt-3 text-center text-heading text-brand-foreground">
          {santri?.nama_lengkap ?? '-'}
        </Text>
        {santri ? (
          <Text className="text-label text-brand-foreground opacity-80">NIS {santri.nis}</Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail hafalan tidak dapat dimuat
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
          {target ? (
            <Card className="border-0 p-4">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-caption text-ink-muted">
                  Target hafalan · {target.tahun_ajaran.nama}
                </Text>
                <Text className="text-label font-semibold text-ink">
                  {juzLembar(target.tercapai_juz)} dari {juzLembar(target.target_juz)}
                </Text>
              </View>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-field">
                <View
                  style={{width: `${Math.min(100, Math.max(0, progress * 100))}%`}}
                  className="h-full rounded-full bg-brand"
                />
              </View>
              {target.catatan ? (
                <Text className="mt-3 text-label text-ink-muted">{target.catatan}</Text>
              ) : null}
            </Card>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              onPress={() => setBulan(data.periode.sebelumnya)}
              hitSlop={10}
              className="h-9 flex-row items-center rounded-full bg-surface pl-2 pr-3"
              accessibilityLabel="Bulan sebelumnya">
              <ChevronLeft size={18} color={colors.brand.DEFAULT} />
              <Text className="text-caption font-medium text-brand">Sebelumnya</Text>
            </Pressable>
            <Pressable onPress={() => setSheet(true)} hitSlop={8} className="items-center">
              <Text className="text-label font-semibold text-ink">{monthLabel(bulan)}</Text>
              <Text className="text-caption text-brand">Ganti bulan</Text>
            </Pressable>
            <Pressable
              onPress={() => setBulan(data.periode.berikutnya)}
              hitSlop={10}
              className="h-9 flex-row items-center rounded-full bg-surface pl-3 pr-2"
              accessibilityLabel="Bulan berikutnya">
              <Text className="text-caption font-medium text-brand">Selanjutnya</Text>
              <ChevronRight size={18} color={colors.brand.DEFAULT} />
            </Pressable>
          </View>

          <View className="mt-4 flex-row gap-3">
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Jumlah setoran</Text>
              <Text className="mt-1 text-heading text-ink">
                {data.ringkasan_bulan.jumlah_setoran}
              </Text>
            </Card>
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Setoran baru</Text>
              <Text className="mt-1 text-heading text-ink">{data.ringkasan_bulan.setoran_baru}</Text>
            </Card>
          </View>

          <Text className="mb-2 ml-1 mt-5 text-caption font-medium tracking-wide text-ink-muted">
            SETORAN · {monthLabel(bulan).toUpperCase()}
          </Text>
          {data.setoran_bulan.length === 0 ? (
            <View className="mt-6 items-center">
              <BookOpen size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada setoran bulan ini</Text>
            </View>
          ) : (
            data.setoran_bulan.map(s => <SetoranRow key={s.id} item={s} />)
          )}
        </ScrollView>
      )}

      <BottomSheet visible={sheet} title="Pilih Bulan" onClose={() => setSheet(false)}>
        <View className="pb-2">
          <MonthPicker
            value={bulan}
            onChange={b => {
              setBulan(b);
              setSheet(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
