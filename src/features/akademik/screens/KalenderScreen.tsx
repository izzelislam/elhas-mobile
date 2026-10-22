import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CalendarDays, SlidersHorizontal} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Select} from '@/components/ui/Select';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getKalender, getTahunAjaran} from '../services/kalender.service';
import type {KalenderEvent, TahunAjaran} from '../types';

const PER_PAGE = 15;
const DAY = 86400000;

const WARNA: Record<string, string> = {
  blue: '#2563EB',
  amber: '#D97706',
  emerald: '#059669',
  rose: '#E11D48',
  red: '#DC2626',
  green: '#16A34A',
  purple: '#7C3AED',
  indigo: '#4F46E5',
  orange: '#EA580C',
  gray: '#6B7280',
};
const warna = (w: string) => WARNA[w] ?? colors.brand.DEFAULT;

const startOfDay = (v: string) => {
  const d = new Date(v);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const fmt = (d: Date, withYear = false) =>
  d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? {year: 'numeric'} : {}),
  });

function range(e: KalenderEvent) {
  const a = startOfDay(e.tanggal_mulai);
  const b = startOfDay(e.tanggal_selesai);
  const days = Math.round((b.getTime() - a.getTime()) / DAY) + 1;
  const text =
    days <= 1 ? fmt(a, true) : `${fmt(a, a.getFullYear() !== b.getFullYear())} – ${fmt(b, true)}`;
  return {a, b, days, text};
}

function statusOf(a: Date, b: Date) {
  const t = startOfDay(new Date().toISOString());
  if (t < a) {
    const d = Math.round((a.getTime() - t.getTime()) / DAY);
    return {
      label: d === 1 ? 'Besok' : `${d} hari lagi`,
      color: '#2563EB',
      done: false,
      live: false,
    };
  }
  if (t > b) {
    return {label: 'Selesai', color: '#6B7280', done: true, live: false};
  }
  return {label: 'Berlangsung', color: '#059669', done: false, live: true};
}

export default function KalenderScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<KalenderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tipe, setTipe] = useState('all');
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [sheet, setSheet] = useState(false);
  const [draftTahun, setDraftTahun] = useState<number | null>(null);
  const [draftTipe, setDraftTipe] = useState('all');

  useEffect(() => {
    getTahunAjaran()
      .then(list =>
        setTahunList(prev => {
          const map = new Map(prev.map(t => [t.id, t]));
          list.forEach(t => map.set(t.id, t));
          return Array.from(map.values());
        }),
      )
      .catch(() => {}); // fallback: opsi dikumpulkan dari data agenda
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getKalender({
        per_page: PER_PAGE,
        tahun_ajaran_id: tahunId ?? undefined,
      });
      setEvents(data);
      // daftar tahun ajaran dikumpulkan dari data yang pernah dimuat
      setTahunList(prev => {
        const map = new Map(prev.map(t => [t.id, t]));
        data.forEach(e => e.tahun_ajaran && map.set(e.tahun_ajaran.id, e.tahun_ajaran));
        return Array.from(map.values()).sort(
          (x, y) => +new Date(y.tanggal_mulai) - +new Date(x.tanggal_mulai),
        );
      });
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat kalender akademik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tahunId]);

  useEffect(() => {
    load();
  }, [load]);

  const openSheet = () => {
    setDraftTahun(tahunId);
    setDraftTipe(tipe);
    setSheet(true);
  };

  const applyFilter = () => {
    setSheet(false);
    setTipe(draftTipe);
    if (draftTahun !== tahunId) {
      setTahunId(draftTahun);
    }
  };

  const [knownTipe, setKnownTipe] = useState<string[]>(['kegiatan', 'ujian', 'libur']);
  useEffect(() => {
    setKnownTipe(prev => Array.from(new Set([...prev, ...events.map(e => e.tipe)])));
  }, [events]);
  const tipeOptions = useMemo(() => ['all', ...knownTipe], [knownTipe]);

  const groups = useMemo(() => {
    const list = events
      .filter(e => tipe === 'all' || e.tipe === tipe)
      .sort((x, y) => +new Date(x.tanggal_mulai) - +new Date(y.tanggal_mulai));
    const map = new Map<string, KalenderEvent[]>();
    list.forEach(e => {
      const key = startOfDay(e.tanggal_mulai).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
      map.set(key, [...(map.get(key) ?? []), e]);
    });
    return Array.from(map.entries());
  }, [events, tipe]);

  const tahunAjaran = tahunId
    ? tahunList.find(t => t.id === tahunId)?.nama
    : events[0]?.tahun_ajaran?.nama;

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Kalender Pendidikan</Text>
          <Pressable onPress={openSheet} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {tahunId !== null || tipe !== 'all' ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {tahunAjaran ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            Tahun ajaran {tahunAjaran}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Kalender tidak dapat dimuat
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
        <>
          <ScrollView
            contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
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
            {groups.length === 0 ? (
              <View className="mt-10 items-center">
                <CalendarDays size={40} color={colors.text.muted} />
                <Text className="mt-3 text-body text-ink-muted">Belum ada agenda</Text>
              </View>
            ) : (
              groups.map(([month, list]) => (
                <View key={month} className="mb-2">
                  <Text className="mb-2 ml-1 mt-2 text-caption font-medium tracking-wide text-ink-muted">
                    {month.toUpperCase()}
                  </Text>
                  {list.map(e => {
                    const {a, b, days, text} = range(e);
                    const st = statusOf(a, b);
                    const c = warna(e.warna);
                    return (
                      <Card
                        key={e.id}
                        style={{opacity: st.done ? 0.65 : 1}}
                        className="mb-3 border-0 p-4">
                        <View className="flex-row">
                          <View
                            style={{backgroundColor: c + '1A'}}
                            className="h-14 w-14 items-center justify-center rounded-2xl">
                            <Text style={{color: c}} className="text-title font-bold leading-6">
                              {a.getDate()}
                            </Text>
                            <Text
                              style={{color: c}}
                              className="text-caption font-medium uppercase">
                              {a.toLocaleDateString('id-ID', {month: 'short'})}
                            </Text>
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-body font-semibold text-ink">
                              {e.nama_kegiatan}
                            </Text>
                            <View className="mt-1 flex-row items-center">
                              <CalendarDays size={13} color={colors.text.muted} />
                              <Text className="ml-1.5 flex-1 text-caption text-ink-muted">
                                {text}
                                {days > 1 ? ` · ${days} hari` : ''}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {e.deskripsi ? (
                          <Text className="mt-3 text-label text-ink-muted">{e.deskripsi}</Text>
                        ) : null}
                        <View className="mt-3 flex-row items-center justify-between border-t border-line pt-3">
                          <View
                            style={{backgroundColor: c + '1A'}}
                            className="rounded-full px-2.5 py-0.5">
                            <Text style={{color: c}} className="text-caption font-medium capitalize">
                              {e.tipe}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <View
                              style={{backgroundColor: st.color}}
                              className="mr-1.5 h-2 w-2 rounded-full"
                            />
                            <Text style={{color: st.color}} className="text-caption font-medium">
                              {st.label}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
      <BottomSheet visible={sheet} title="Filter" onClose={() => setSheet(false)}>
        <View className="gap-4 pb-1">
          <Select<number | null>
            label="Tahun Ajaran"
            value={draftTahun}
            onChange={setDraftTahun}
            options={[
              {value: null, label: 'Semua tahun ajaran'},
              ...tahunList.map(t => ({
                value: t.id,
                label: t.is_aktif ? `${t.nama} (aktif)` : t.nama,
              })),
            ]}
          />
          {tipeOptions.length > 2 ? (
            <Select<string>
              label="Tipe Agenda"
              value={draftTipe}
              onChange={setDraftTipe}
              options={tipeOptions.map(t => ({
                value: t,
                label: t === 'all' ? 'Semua tipe' : t.charAt(0).toUpperCase() + t.slice(1),
              }))}
            />
          ) : null}
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Reset"
              variant="outline"
              onPress={() => {
                setDraftTahun(null);
                setDraftTipe('all');
              }}
            />
          </View>
          <View className="flex-1">
            <Button title="Terapkan" onPress={applyFilter} />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
