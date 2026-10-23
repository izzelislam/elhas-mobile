import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isAxiosError} from 'axios';
import {ArrowLeft, CalendarDays} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {
  Kelas,
  getCachedReferensi,
  loadReferensi,
} from '@/features/santri/services/referensi.service';
import {getSantriList} from '@/features/santri/services/santri.service';
import type {Santri} from '@/features/santri/types';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {HARI, hariLabel} from '../components/JadwalFilterSheet';
import {AbsensiStatus, createAbsensi} from '../services/absensi.service';
import {JadwalPelajaran, getJadwalList} from '../services/jadwal.service';

const STATUS_OPTIONS: {
  value: AbsensiStatus;
  label: string;
  short: string;
  color: string;
}[] = [
  {value: 'hadir', label: 'Hadir', short: 'H', color: '#059669'},
  {value: 'sakit', label: 'Sakit', short: 'S', color: '#D97706'},
  {value: 'izin', label: 'Izin', short: 'I', color: '#2563EB'},
  {value: 'alpha', label: 'Alpha', short: 'A', color: '#DC2626'},
];

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

const hariOf = (tanggal: string) =>
  HARI[(new Date(tanggal + 'T00:00:00').getDay() + 6) % 7];

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    const first = data?.errors
      ? (Object.values(data.errors)[0] as string[] | undefined)?.[0]
      : null;
    return (
      first ??
      data?.message ??
      (err.response
        ? 'Gagal menyimpan absensi'
        : 'Tidak dapat terhubung ke server')
    );
  }
  return 'Terjadi kesalahan, coba lagi';
}

type Row = {status: AbsensiStatus; keterangan: string};

export default function AbsensiFormScreen({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [kelasList, setKelasList] = useState<Kelas[]>(
    getCachedReferensi()?.kelas ?? [],
  );
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(todayKey());
  const [jadwalId, setJadwalId] = useState<number | null>(null);
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [santri, setSantri] = useState<Santri[]>([]);
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => setKelasList(ref.kelas))
        .catch(() => toast.error('Gagal memuat daftar kelas'));
    }
  }, []);

  // Jadwal pelajaran kelas terpilih; yang ditampilkan hanya yang jatuh pada hari tanggal absensi.
  useEffect(() => {
    setJadwal([]);
    setJadwalId(null);
    if (kelasId) {
      getJadwalList({kelas_id: kelasId})
        .then(setJadwal)
        .catch(() => toast.error('Gagal memuat jadwal pelajaran'));
    }
  }, [kelasId]);

  useEffect(() => {
    setJadwalId(null);
  }, [tanggal]);

  useEffect(() => {
    setSantri([]);
    setRows({});
    if (!kelasId) {
      return;
    }
    let cancelled = false;
    setLoadingSantri(true);
    (async () => {
      const all: Santri[] = [];
      let page = 1;
      let last = 1;
      do {
        const res = await getSantriList({
          kelas_id: kelasId,
          status: 'aktif',
          per_page: 100,
          page,
        });
        all.push(...res.data);
        last = res.meta.last_page;
        page++;
      } while (page <= last);
      if (cancelled) {
        return;
      }
      setSantri(all);
      setRows(
        Object.fromEntries(
          all.map(s => [s.id, {status: 'hadir', keterangan: ''}]),
        ),
      );
    })()
      .catch(() => !cancelled && toast.error('Gagal memuat santri'))
      .finally(() => !cancelled && setLoadingSantri(false));
    return () => {
      cancelled = true;
    };
  }, [kelasId]);

  const kelasOptions = useMemo(
    () => kelasList.map(k => ({value: k.id as number | null, label: k.nama})),
    [kelasList],
  );

  const jadwalOptions = useMemo(() => {
    const hari = hariOf(tanggal);
    return [
      {value: null as number | null, label: 'Harian (semua pelajaran)'},
      ...jadwal
        .filter(j => j.hari === hari)
        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
        .map(j => ({
          value: j.id as number | null,
          label: `${j.jam_mulai.slice(0, 5)} · ${
            j.mata_pelajaran?.nama ?? '-'
          }`,
        })),
    ];
  }, [jadwal, tanggal]);

  const setStatus = (id: number, status: AbsensiStatus) =>
    setRows(r => ({...r, [id]: {...r[id], status}}));

  const summary = STATUS_OPTIONS.map(o => ({
    ...o,
    count: santri.filter(s => rows[s.id]?.status === o.value).length,
  }));

  const submit = async () => {
    if (!kelasId || !santri.length) {
      toast.error('Pilih kelas yang memiliki santri');
      return;
    }
    setSaving(true);
    try {
      const res = await createAbsensi({
        kelas_id: kelasId,
        tanggal,
        jadwal_pelajaran_id: jadwalId,
        records: santri.map(s => ({
          santri_id: s.id,
          status: rows[s.id]?.status ?? 'hadir',
          keterangan: rows[s.id]?.keterangan.trim() || null,
        })),
      });
      toast.success(res.message || 'Absensi berhasil disimpan');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior="padding">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Input Absensi
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 rounded-card bg-surface p-5">
          <Select<number | null>
            label="Kelas"
            placeholder="Pilih kelas"
            value={kelasId}
            onChange={setKelasId}
            options={kelasOptions}
          />
          <PickerField
            icon={CalendarDays}
            label="Tanggal"
            value={dateId(tanggal)}
            placeholder="Pilih tanggal"
            onPress={() => setCalendar(true)}
            onClear={() => setTanggal(todayKey())}
          />
          <View>
            <Select<number | null>
              label="Pelajaran"
              placeholder="Harian (semua pelajaran)"
              value={jadwalId}
              onChange={setJadwalId}
              options={jadwalOptions}
            />
            <Text className="mt-1 text-caption text-ink-muted">
              {jadwalId
                ? 'Absensi khusus pelajaran ini.'
                : `Tanpa pelajaran = absensi harian untuk seluruh hari ${hariLabel(
                    hariOf(tanggal),
                  )}.`}
            </Text>
          </View>
        </View>

        {kelasId ? (
          <View className="mt-5 rounded-card bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-title text-ink">
                Santri ({santri.length})
              </Text>
              {santri.length > 0 ? (
                <Pressable
                  onPress={() =>
                    setRows(
                      Object.fromEntries(
                        santri.map(s => [
                          s.id,
                          {status: 'hadir', keterangan: ''},
                        ]),
                      ),
                    )
                  }
                  hitSlop={8}
                >
                  <Text className="text-label font-medium text-brand">
                    Semua hadir
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {santri.length > 0 ? (
              <View className="mt-3 flex-row gap-2">
                {summary.map(o => (
                  <View
                    key={o.value}
                    style={{backgroundColor: o.color + '1A'}}
                    className="flex-1 items-center rounded-card py-2"
                  >
                    <Text
                      style={{color: o.color}}
                      className="text-body font-bold"
                    >
                      {o.count}
                    </Text>
                    <Text style={{color: o.color}} className="text-caption">
                      {o.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {loadingSantri ? (
              <ActivityIndicator
                className="py-8"
                color={colors.brand.DEFAULT}
              />
            ) : santri.length === 0 ? (
              <Text className="py-8 text-center text-body text-ink-muted">
                Tidak ada santri aktif di kelas ini
              </Text>
            ) : (
              santri.map(s => {
                const row = rows[s.id] ?? {
                  status: 'hadir' as AbsensiStatus,
                  keterangan: '',
                };
                return (
                  <View key={s.id} className="mt-4 border-t border-line pt-4">
                    <View className="flex-row items-center">
                      <Avatar name={s.nama_lengkap} size={36} />
                      <View className="ml-3 flex-1">
                        <Text
                          className="text-label font-semibold text-ink"
                          numberOfLines={1}
                        >
                          {s.nama_lengkap}
                        </Text>
                        <Text className="text-caption text-ink-muted">
                          NIS {s.nis}
                        </Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row gap-2">
                      {STATUS_OPTIONS.map(o => {
                        const active = row.status === o.value;
                        return (
                          <Pressable
                            key={o.value}
                            onPress={() => setStatus(s.id, o.value)}
                            style={
                              active ? {backgroundColor: o.color} : undefined
                            }
                            className={`h-10 flex-1 items-center justify-center rounded-full ${
                              active ? '' : 'bg-field'
                            }`}
                          >
                            <Text
                              style={active ? undefined : {color: o.color}}
                              className={`text-label font-semibold ${
                                active ? 'text-brand-foreground' : ''
                              }`}
                            >
                              {o.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {row.status !== 'hadir' ? (
                      <TextInput
                        value={row.keterangan}
                        onChangeText={v =>
                          setRows(r => ({
                            ...r,
                            [s.id]: {...r[s.id], keterangan: v},
                          }))
                        }
                        placeholder="Keterangan (opsional)"
                        placeholderTextColor={colors.text.muted}
                        className="mt-2 h-11 rounded-card border border-line bg-field px-4 text-body text-ink"
                      />
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        <View className="mt-5">
          <Button
            title="Simpan Absensi"
            loading={saving}
            disabled={!kelasId || santri.length === 0}
            onPress={submit}
          />
        </View>
      </ScrollView>

      <BottomSheet
        visible={calendar}
        title="Pilih Tanggal"
        onClose={() => setCalendar(false)}
      >
        <View className="pb-2">
          <CalendarPicker
            value={tanggal}
            maxDate={todayKey()}
            onChange={t => {
              setTanggal(t ?? todayKey());
              setCalendar(false);
            }}
          />
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
