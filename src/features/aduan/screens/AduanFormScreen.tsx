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
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {Aduan, createAduan, editAduan} from '../services/aduan.service';

export default function AduanFormScreen({
  onBack,
  onSaved,
  aduan,
}: {
  onBack: () => void;
  onSaved: () => void;
  /** Bila diisi, form mengubah aduan ini (santri tidak bisa diganti). */
  aduan?: Aduan;
}) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [pickSantri, setPickSantri] = useState(false);
  const [judul, setJudul] = useState(aduan?.judul ?? '');
  const [isi, setIsi] = useState(aduan?.isi ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const clear = (key: string) => setErrors(e => ({...e, [key]: ''}));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!aduan && !santri) {
      e.santri = 'Santri wajib dipilih';
    }
    if (!judul.trim()) {
      e.judul = 'Judul wajib diisi';
    }
    if (!isi.trim()) {
      e.isi = 'Isi aduan wajib diisi';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setSaving(true);
    try {
      const body = {judul: judul.trim(), isi: isi.trim()};
      const res =
        aduan
          ? await editAduan(aduan.id, body)
          : await createAduan({santri_id: santri!.id, ...body}); // santri sudah divalidasi di atas
      toast.success(res.message || (aduan ? 'Aduan berhasil diubah' : 'Aduan berhasil dikirim'));
      onSaved();
    } catch (err) {
      toast.error(describeError(err) || (aduan ? 'Gagal mengubah aduan' : 'Gagal mengirim aduan'));
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
          <Text className="ml-3 text-title text-brand-foreground">
            {aduan ? 'Ubah Aduan' : 'Buat Aduan'}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View className="gap-5 rounded-card bg-surface p-5">
          {aduan ? null : (
          <View>
            <PickerField
              icon={User}
              label="Santri"
              value={santri?.nama ?? null}
              placeholder="Pilih santri"
              onPress={() => setPickSantri(true)}
              onClear={() => setSantri(null)}
            />
            {errors.santri ? (
              <Text className="mt-1 text-caption text-destructive">{errors.santri}</Text>
            ) : null}
          </View>
          )}

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Judul</Text>
            <TextInput
              value={judul}
              onChangeText={v => {
                setJudul(v);
                clear('judul');
              }}
              placeholder="Ringkasan aduan"
              placeholderTextColor={colors.text.muted}
              className="h-12 rounded-card border border-line bg-field px-4 text-body text-ink"
            />
            {errors.judul ? (
              <Text className="mt-1 text-caption text-destructive">{errors.judul}</Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Isi aduan</Text>
            <TextInput
              value={isi}
              onChangeText={v => {
                setIsi(v);
                clear('isi');
              }}
              placeholder="Jelaskan aduan Anda"
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              className="min-h-[140px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
            />
            {errors.isi ? (
              <Text className="mt-1 text-caption text-destructive">{errors.isi}</Text>
            ) : null}
          </View>

          <Button title={aduan ? 'Simpan perubahan' : 'Kirim aduan'} loading={saving} onPress={submit} />
        </View>
      </ScrollView>

      <BottomSheet visible={pickSantri} title="Pilih Santri" onClose={() => setPickSantri(false)}>
        <SantriPicker
          onPick={s => {
            setSantri({id: s.id, nama: s.nama_lengkap});
            clear('santri');
            setPickSantri(false);
          }}
        />
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
