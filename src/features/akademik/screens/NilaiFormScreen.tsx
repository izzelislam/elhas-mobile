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
import {ArrowLeft} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
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
import {JENIS} from '../components/NilaiFilterSheet';
import {getJadwalList} from '../services/jadwal.service';
import {getTahunAjaran} from '../services/kalender.service';
import {createNilai} from '../services/nilai.service';
import type {TahunAjaran} from '../types';

const SEMESTER = [
  {value: 'ganjil', label: 'Ganjil'},
  {value: 'genap', label: 'Genap'},
];

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
        ? 'Gagal menyimpan nilai'
        : 'Tidak dapat terhubung ke server')
    );
  }
  return 'Terjadi kesalahan, coba lagi';
}

/** Hanya angka 0–100 (maks. 2 desimal); input yang melewati batas ditolak. */
function sanitizeNilai(next: string, prev: string) {
  const v = next.replace(/[^0-9.,]/g, '').replace(',', '.');
  if (!/^\d{0,3}(\.\d{0,2})?$/.test(v) || Number(v) > 100) {
    return prev;
  }
  return v;
}

type Row = {nilai: string; catatan: string};

export default function NilaiFormScreen({
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
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [mapelId, setMapelId] = useState<number | null>(null);
  const [mapel, setMapel] = useState<{id: number; nama: string}[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [semester, setSemester] = useState<string>('ganjil');
  const [jenis, setJenis] = useState<string | null>(null);
  const [santri, setSantri] = useState<Santri[]>([]);
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => setKelasList(ref.kelas))
        .catch(() => toast.error('Gagal memuat daftar kelas'));
    }
    getTahunAjaran()
      .then(list => {
        setTahunList(list);
        setTahunId(list.find(t => t.is_aktif)?.id ?? null);
      })
      .catch(() => toast.error('Gagal memuat tahun ajaran'));
  }, []);

  // Mata pelajaran yang diajarkan di kelas terpilih, diambil dari jadwal pelajaran kelas itu.
  useEffect(() => {
    setMapel([]);
    setMapelId(null);
    if (kelasId) {
      getJadwalList({kelas_id: kelasId})
        .then(list => {
          const map = new Map<number, string>();
          list.forEach(
            j =>
              j.mata_pelajaran &&
              map.set(j.mata_pelajaran.id, j.mata_pelajaran.nama),
          );
          setMapel([...map].map(([id, nama]) => ({id, nama})));
        })
        .catch(() => toast.error('Gagal memuat mata pelajaran'));
    }
  }, [kelasId]);

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
      if (!cancelled) {
        setSantri(all);
        setRows(
          Object.fromEntries(all.map(s => [s.id, {nilai: '', catatan: ''}])),
        );
      }
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
  const mapelOptions = useMemo(
    () => mapel.map(m => ({value: m.id as number | null, label: m.nama})),
    [mapel],
  );
  const tahunOptions = useMemo(
    () => tahunList.map(t => ({value: t.id as number | null, label: t.nama})),
    [tahunList],
  );

  const filled = santri.filter(
    s => rows[s.id]?.nilai.trim() !== '' && rows[s.id],
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!kelasId) {
      e.kelas = 'Kelas wajib dipilih';
    }
    if (!mapelId) {
      e.mapel = 'Mata pelajaran wajib dipilih';
    }
    if (!tahunId) {
      e.tahun = 'Tahun ajaran wajib dipilih';
    }
    if (!jenis) {
      e.jenis = 'Jenis nilai wajib dipilih';
    }
    const invalid = filled.filter(s => {
      const n = Number(rows[s.id].nilai.replace(',', '.'));
      return Number.isNaN(n) || n < 0 || n > 100;
    });
    if (invalid.length) {
      e.nilai = `Nilai harus 0–100 (${invalid[0].nama_lengkap})`;
    } else if (!filled.length) {
      e.nilai = 'Isi nilai minimal satu santri';
    }
    setErrors(e);
    if (Object.keys(e).length || !kelasId || !mapelId || !tahunId || !jenis) {
      return;
    }
    setSaving(true);
    try {
      const res = await createNilai({
        kelas_id: kelasId,
        mata_pelajaran_id: mapelId,
        tahun_ajaran_id: tahunId,
        semester,
        jenis,
        records: filled.map(s => ({
          santri_id: s.id,
          nilai: Number(rows[s.id].nilai.replace(',', '.')),
          catatan: rows[s.id].catatan.trim() || null,
        })),
      });
      toast.success(res.message || 'Nilai berhasil disimpan');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const err = (k: string) =>
    errors[k] ? (
      <Text className="mt-1 text-caption text-destructive">{errors[k]}</Text>
    ) : null;

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
            Input Nilai
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
          <View>
            <Select<number | null>
              label="Kelas"
              placeholder="Pilih kelas"
              value={kelasId}
              onChange={v => {
                setKelasId(v);
                setErrors(er => ({...er, kelas: ''}));
              }}
              options={kelasOptions}
            />
            {err('kelas')}
          </View>
          <View>
            <Select<number | null>
              label="Mata pelajaran"
              placeholder={
                kelasId ? 'Pilih mata pelajaran' : 'Pilih kelas dulu'
              }
              value={mapelId}
              onChange={v => {
                setMapelId(v);
                setErrors(er => ({...er, mapel: ''}));
              }}
              options={mapelOptions}
            />
            {err('mapel')}
          </View>
          <View>
            <Select<number | null>
              label="Tahun ajaran"
              placeholder="Pilih tahun ajaran"
              value={tahunId}
              onChange={v => {
                setTahunId(v);
                setErrors(er => ({...er, tahun: ''}));
              }}
              options={tahunOptions}
            />
            {err('tahun')}
          </View>
          <Select<string>
            label="Semester"
            value={semester}
            onChange={setSemester}
            options={SEMESTER}
          />
          <View>
            <Select<string | null>
              label="Jenis nilai"
              placeholder="Pilih jenis nilai"
              value={jenis}
              onChange={v => {
                setJenis(v);
                setErrors(er => ({...er, jenis: ''}));
              }}
              options={JENIS}
            />
            {err('jenis')}
          </View>
        </View>

        {kelasId ? (
          <View className="mt-5 rounded-card bg-surface p-5">
            <Text className="text-title text-ink">
              Santri ({santri.length})
            </Text>
            {santri.length > 0 ? (
              <Text className="mt-1 text-caption text-ink-muted">
                {filled.length} dari {santri.length} santri terisi. Santri yang
                dikosongkan tidak disimpan.
              </Text>
            ) : null}
            {errors.nilai ? (
              <Text className="mt-2 text-caption text-destructive">
                {errors.nilai}
              </Text>
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
                const row = rows[s.id] ?? {nilai: '', catatan: ''};
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
                      <TextInput
                        value={row.nilai}
                        onChangeText={v => {
                          setRows(r => ({
                            ...r,
                            [s.id]: {
                              ...r[s.id],
                              nilai: sanitizeNilai(v, r[s.id]?.nilai ?? ''),
                            },
                          }));
                          setErrors(er => ({...er, nilai: ''}));
                        }}
                        placeholder="0–100"
                        placeholderTextColor={colors.text.muted}
                        keyboardType="decimal-pad"
                        maxLength={5}
                        className="h-11 w-20 rounded-card border border-line bg-field px-3 text-center text-body font-semibold text-ink"
                      />
                    </View>
                    {row.nilai ? (
                      <TextInput
                        value={row.catatan}
                        onChangeText={v =>
                          setRows(r => ({
                            ...r,
                            [s.id]: {...r[s.id], catatan: v},
                          }))
                        }
                        placeholder="Catatan (opsional)"
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
            title="Simpan Nilai"
            loading={saving}
            disabled={!kelasId || santri.length === 0}
            onPress={submit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
