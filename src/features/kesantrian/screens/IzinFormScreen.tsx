import React, {useState} from 'react';
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
import {ArrowLeft, CalendarDays, User, UserRound} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {TextField} from '@/components/ui/TextField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {createIzin} from '../services/izin.service';

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
      (err.response ? 'Gagal menyimpan izin' : 'Tidak dapat terhubung ke server')
    );
  }
  return 'Terjadi kesalahan, coba lagi';
}

export default function IzinFormScreen({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [keluar, setKeluar] = useState(todayKey());
  const [kembali, setKembali] = useState(todayKey());
  const [keperluan, setKeperluan] = useState('');
  const [penjemput, setPenjemput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<'santri' | 'keluar' | 'kembali' | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!santri) {
      e.santri = 'Santri wajib dipilih';
    }
    if (kembali < keluar) {
      e.kembali = 'Tanggal kembali tidak boleh sebelum tanggal keluar';
    }
    if (!keperluan.trim()) {
      e.keperluan = 'Keperluan wajib diisi';
    }
    setErrors(e);
    if (Object.keys(e).length || !santri) {
      return;
    }
    setSaving(true);
    try {
      const res = await createIzin({
        santri_id: santri.id,
        tanggal_keluar: keluar,
        tanggal_kembali_rencana: kembali,
        keperluan: keperluan.trim(),
        nama_penjemput: penjemput.trim() || undefined,
      });
      toast.success(res.message || 'Izin berhasil diajukan');
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
          <Text className="ml-3 text-title text-brand-foreground">Ajukan Izin</Text>
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

          <PickerField
            icon={CalendarDays}
            label="Tanggal Keluar"
            value={dateId(keluar)}
            placeholder="Pilih tanggal"
            onPress={() => setSheet('keluar')}
            onClear={() => setKeluar(todayKey())}
          />

          <View>
            <PickerField
              icon={CalendarDays}
              label="Rencana Tanggal Kembali"
              value={dateId(kembali)}
              placeholder="Pilih tanggal"
              onPress={() => setSheet('kembali')}
              onClear={() => setKembali(keluar)}
            />
            {errors.kembali ? (
              <Text className="mt-1 text-caption text-destructive">{errors.kembali}</Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Keperluan</Text>
            <TextInput
              value={keperluan}
              onChangeText={v => {
                setKeperluan(v);
                setErrors(er => ({...er, keperluan: ''}));
              }}
              placeholder="Contoh: Keperluan keluarga"
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              className={`min-h-[96px] rounded-card border bg-field px-4 py-3 text-body text-ink ${
                errors.keperluan ? 'border-destructive' : 'border-line'
              }`}
            />
            {errors.keperluan ? (
              <Text className="mt-1 text-caption text-destructive">{errors.keperluan}</Text>
            ) : null}
          </View>

          <TextField
            label="Nama Penjemput (opsional)"
            icon={UserRound}
            placeholder="Nama penjemput"
            autoCapitalize="words"
            value={penjemput}
            onChangeText={setPenjemput}
          />

          <Button title="Ajukan Izin" loading={saving} onPress={submit} />
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
        visible={sheet === 'keluar' || sheet === 'kembali'}
        title={sheet === 'keluar' ? 'Tanggal Keluar' : 'Rencana Tanggal Kembali'}
        onClose={() => setSheet(null)}>
        <View className="pb-2">
          <CalendarPicker
            key={sheet ?? 'x'}
            value={sheet === 'keluar' ? keluar : kembali}
            onChange={t => {
              if (sheet === 'keluar') {
                setKeluar(t);
                if (kembali < t) {
                  setKembali(t);
                }
              } else {
                setKembali(t);
                setErrors(er => ({...er, kembali: ''}));
              }
              setSheet(null);
            }}
          />
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
