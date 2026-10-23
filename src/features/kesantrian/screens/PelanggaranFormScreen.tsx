import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isAxiosError} from 'axios';
import {ArrowLeft, CalendarDays, Check, ShieldAlert, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {
  JenisPelanggaran,
  createPelanggaran,
  getJenisPelanggaran,
} from '../services/pelanggaran.service';

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

const KATEGORI: Record<string, {label: string; color: string; order: number}> = {
  ringan: {label: 'Ringan', color: '#6B7280', order: 0},
  sedang: {label: 'Sedang', color: '#D97706', order: 1},
  berat: {label: 'Berat', color: '#DC2626', order: 2},
};
const kategoriOf = (j: JenisPelanggaran) =>
  KATEGORI[j.kategori.value] ?? {label: j.kategori.label, color: '#6B7280', order: 9};

function KategoriChip({j}: {j: JenisPelanggaran}) {
  const k = kategoriOf(j);
  return (
    <View style={{backgroundColor: k.color + '1A'}} className="rounded-full px-2.5 py-0.5">
      <Text style={{color: k.color}} className="text-caption font-medium">
        {k.label} · {j.poin} poin
      </Text>
    </View>
  );
}

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    const first = data?.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : null;
    return first ?? data?.message ?? (err.response ? 'Gagal menyimpan pelanggaran' : 'Tidak dapat terhubung ke server');
  }
  return 'Terjadi kesalahan, coba lagi';
}

export default function PelanggaranFormScreen({onBack, onSaved}: Props) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [jenisList, setJenisList] = useState<JenisPelanggaran[]>([]);
  const [jenisLoading, setJenisLoading] = useState(true);
  const [jenisId, setJenisId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState<string>(todayKey());
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<'santri' | 'tanggal' | 'jenis' | null>(null);
  const [saving, setSaving] = useState(false);

  const loadJenis = useCallback(async () => {
    setJenisLoading(true);
    try {
      setJenisList(await getJenisPelanggaran());
    } catch {
      toast.error('Gagal memuat jenis pelanggaran');
    } finally {
      setJenisLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJenis();
  }, [loadJenis]);

  const jenis = jenisList.find(j => j.id === jenisId) ?? null;
  const groups = useMemo(() => {
    const map = new Map<string, JenisPelanggaran[]>();
    jenisList.forEach(j => map.set(j.kategori.value, [...(map.get(j.kategori.value) ?? []), j]));
    return Array.from(map.entries())
      .sort(([a], [b]) => (KATEGORI[a]?.order ?? 9) - (KATEGORI[b]?.order ?? 9))
      .map(([key, list]) => ({
        key,
        label: list[0].kategori.label,
        color: (KATEGORI[key] ?? {color: '#6B7280'}).color,
        items: [...list].sort((x, y) => x.nama.localeCompare(y.nama)),
      }));
  }, [jenisList]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!santri) {
      e.santri = 'Santri wajib dipilih';
    }
    if (jenisId === null) {
      e.jenis = 'Jenis pelanggaran wajib dipilih';
    }
    setErrors(e);
    if (Object.keys(e).length || !santri || jenisId === null) {
      return;
    }
    setSaving(true);
    try {
      const res = await createPelanggaran({
        santri_id: santri.id,
        jenis_pelanggaran_id: jenisId,
        tanggal,
        catatan: catatan.trim() || undefined,
      });
      toast.success(res.message || 'Pelanggaran berhasil dicatat');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior="padding">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Catat Pelanggaran</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View className="gap-5 rounded-card bg-surface p-5">
          <View>
            <PickerField
              icon={User}
              label="Santri"
              value={santri?.nama ?? null}
              placeholder="Pilih santri"
              onPress={() => setSheet('santri')}
              onClear={() => setSantri(null)}
            />
            {errors.santri ? (
              <Text className="mt-1 text-caption text-destructive">{errors.santri}</Text>
            ) : null}
          </View>

          <View>
            <PickerField
              icon={ShieldAlert}
              label="Jenis Pelanggaran"
              value={jenis?.nama ?? null}
              placeholder={jenisLoading ? 'Memuat jenis pelanggaran…' : 'Pilih jenis pelanggaran'}
              onPress={() => (jenisList.length ? setSheet('jenis') : loadJenis())}
              onClear={() => setJenisId(null)}
            />
            {jenis ? (
              <View className="mt-2 self-start">
                <KategoriChip j={jenis} />
              </View>
            ) : null}
            {errors.jenis ? (
              <Text className="mt-1 text-caption text-destructive">{errors.jenis}</Text>
            ) : null}
          </View>

          <PickerField
            icon={CalendarDays}
            label="Tanggal"
            value={dateId(tanggal)}
            placeholder="Pilih tanggal"
            onPress={() => setSheet('tanggal')}
            onClear={() => setTanggal(todayKey())}
          />

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Catatan (opsional)</Text>
            <TextInput
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Tulis catatan"
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              className="min-h-[96px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
            />
          </View>

          <Button title="Simpan" loading={saving} onPress={submit} />
        </View>
      </ScrollView>

      <BottomSheet
        visible={sheet === 'santri'}
        title="Pilih Santri"
        onClose={() => setSheet(null)}>
        <SantriPicker
          onPick={s => {
            setSantri({id: s.id, nama: s.nama_lengkap});
            setErrors(er => ({...er, santri: ''}));
            setSheet(null);
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={sheet === 'jenis'}
        title="Pilih Jenis Pelanggaran"
        onClose={() => setSheet(null)}>
        <ScrollView style={{maxHeight: 440}} showsVerticalScrollIndicator={false}>
          {groups.map(g => (
            <View key={g.key} className="mb-2">
              <Text
                style={{color: g.color}}
                className="mb-1 text-caption font-semibold uppercase tracking-wide">
                {g.label}
              </Text>
              {g.items.map(j => {
                const active = j.id === jenisId;
                return (
                  <Pressable
                    key={j.id}
                    onPress={() => {
                      setJenisId(j.id);
                      setErrors(er => ({...er, jenis: ''}));
                      setSheet(null);
                    }}
                    className="flex-row items-center border-t border-line py-3 active:opacity-70">
                    <Text className="flex-1 pr-3 text-body text-ink">{j.nama}</Text>
                    <Text className="text-label font-medium text-ink-muted">{j.poin} poin</Text>
                    {active ? (
                      <Check size={16} color={colors.brand.DEFAULT} style={{marginLeft: 8}} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
      <BottomSheet
        visible={sheet === 'tanggal'}
        title="Pilih Tanggal"
        onClose={() => setSheet(null)}>
        <View className="pb-2">
          <CalendarPicker
            value={tanggal}
            onChange={t => {
              setTanggal(t);
              setSheet(null);
            }}
          />
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
