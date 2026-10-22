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
import {createPelanggaran} from '../services/pelanggaran.service';

type Props = {
  jenisOptions: {id: number; nama: string}[];
  onBack: () => void;
  onSaved: () => void;
};

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

export default function PelanggaranFormScreen({jenisOptions, onBack, onSaved}: Props) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [jenisId, setJenisId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState<string>(todayKey());
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<'santri' | 'tanggal' | null>(null);
  const [saving, setSaving] = useState(false);

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            <Select<number | null>
              label="Jenis Pelanggaran"
              placeholder="Pilih jenis pelanggaran"
              value={jenisId}
              onChange={v => {
                setJenisId(v);
                setErrors(er => ({...er, jenis: ''}));
              }}
              options={jenisOptions.map(j => ({value: j.id, label: j.nama}))}
            />
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
