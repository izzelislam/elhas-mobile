import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isAxiosError} from 'axios';
import {ArrowLeft, CalendarDays, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {createSetoran} from '../services/setoran.service';
import {SURAH} from '../surah';

const JENIS_OPTIONS = [
  {value: 'setoran_baru', label: 'Setoran Baru'},
  {value: 'murajaah', label: 'Murajaah'},
];

const KUALITAS_OPTIONS = [
  {value: 'mumtaz', label: 'Mumtaz (Sangat Baik)'},
  {value: 'jayyid_jiddan', label: 'Jayyid Jiddan (Baik Sekali)'},
  {value: 'jayyid', label: 'Jayyid (Baik)'},
  {value: 'maqbul', label: 'Maqbul (Cukup)'},
];

const SURAH_OPTIONS = SURAH.map((nama, i) => ({value: i + 1, label: `${i + 1}. ${nama}`}));

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
    return (
      first ??
      data?.message ??
      (err.response ? 'Gagal menyimpan setoran' : 'Tidak dapat terhubung ke server')
    );
  }
  return 'Terjadi kesalahan, coba lagi';
}

const inputClass = (error?: string) =>
  `h-12 rounded-card border bg-field px-4 text-body text-ink ${
    error ? 'border-destructive' : 'border-line'
  }`;

export default function SetoranFormScreen({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [jenis, setJenis] = useState<string>('setoran_baru');
  const [surahMulai, setSurahMulai] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState('1');
  const [surahSelesai, setSurahSelesai] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [kualitas, setKualitas] = useState<string>('mumtaz');
  const [tanggal, setTanggal] = useState(todayKey());
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<'santri' | 'tanggal' | null>(null);
  const [saving, setSaving] = useState(false);

  const clear = (key: string) => setErrors(er => ({...er, [key]: ''}));

  const submit = async () => {
    const mulai = parseInt(ayatMulai, 10);
    const selesai = parseInt(ayatSelesai, 10);
    const e: Record<string, string> = {};
    if (!santri) {
      e.santri = 'Santri wajib dipilih';
    }
    if (!(mulai >= 1)) {
      e.ayatMulai = 'Ayat mulai wajib diisi';
    }
    if (!(selesai >= 1)) {
      e.ayatSelesai = 'Ayat selesai wajib diisi';
    }
    if (surahSelesai < surahMulai) {
      e.surahSelesai = 'Surah selesai tidak boleh sebelum surah mulai';
    } else if (surahSelesai === surahMulai && selesai < mulai) {
      e.ayatSelesai = 'Ayat selesai tidak boleh sebelum ayat mulai';
    }
    setErrors(e);
    if (Object.keys(e).length || !santri) {
      return;
    }
    setSaving(true);
    try {
      const res = await createSetoran({
        santri_id: santri.id,
        jenis,
        surah_mulai: surahMulai,
        ayat_mulai: mulai,
        surah_selesai: surahSelesai,
        ayat_selesai: selesai,
        kualitas,
        tanggal,
        catatan: catatan.trim() || null,
      });
      toast.success(res.message || 'Setoran berhasil dicatat');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Catat Setoran</Text>
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

          <Select<string>
            label="Jenis"
            value={jenis}
            onChange={setJenis}
            options={JENIS_OPTIONS}
          />

          <View className="gap-3">
            <Text className="text-label font-medium text-ink">Mulai dari</Text>
            <Select<number>
              value={surahMulai}
              onChange={v => {
                setSurahMulai(v);
                if (surahSelesai < v) {
                  setSurahSelesai(v);
                }
                clear('surahSelesai');
              }}
              options={SURAH_OPTIONS}
            />
            <View>
              <TextInput
                value={ayatMulai}
                onChangeText={v => {
                  setAyatMulai(v.replace(/\D/g, ''));
                  clear('ayatMulai');
                }}
                keyboardType="number-pad"
                placeholder="Ayat mulai"
                placeholderTextColor={colors.text.muted}
                className={inputClass(errors.ayatMulai)}
              />
              {errors.ayatMulai ? (
                <Text className="mt-1 text-caption text-destructive">{errors.ayatMulai}</Text>
              ) : null}
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-label font-medium text-ink">Sampai</Text>
            <View>
              <Select<number>
                value={surahSelesai}
                onChange={v => {
                  setSurahSelesai(v);
                  clear('surahSelesai');
                }}
                options={SURAH_OPTIONS}
              />
              {errors.surahSelesai ? (
                <Text className="mt-1 text-caption text-destructive">{errors.surahSelesai}</Text>
              ) : null}
            </View>
            <View>
              <TextInput
                value={ayatSelesai}
                onChangeText={v => {
                  setAyatSelesai(v.replace(/\D/g, ''));
                  clear('ayatSelesai');
                }}
                keyboardType="number-pad"
                placeholder="Ayat selesai"
                placeholderTextColor={colors.text.muted}
                className={inputClass(errors.ayatSelesai)}
              />
              {errors.ayatSelesai ? (
                <Text className="mt-1 text-caption text-destructive">{errors.ayatSelesai}</Text>
              ) : null}
            </View>
          </View>

          <Select<string>
            label="Kualitas"
            value={kualitas}
            onChange={setKualitas}
            options={KUALITAS_OPTIONS}
          />

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
            clear('santri');
            setSheet(null);
          }}
        />
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
