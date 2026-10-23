import React, {useState} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ImagePlus, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {describeError} from '@/lib/errors';
import {useAuthStore} from '@/store/auth.store';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {BuktiFile, bayarTagihan} from '../services/tagihan.service';
import type {Tagihan} from '../types';

const METODE = [
  {key: 'transfer', label: 'Transfer'},
  {key: 'tabungan', label: 'Tabungan'},
];

/** Wali wajib melampirkan bukti (pembayaran menunggu konfirmasi); petugas mencatat langsung, bukti opsional. */
export default function BayarTagihanScreen({
  tagihan,
  onBack,
  onSaved,
}: {
  tagihan: Tagihan;
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isWali = useAuthStore(s => s.user?.roles.some(r => /wali/i.test(r)) ?? false);
  const [nominal, setNominal] = useState(String(tagihan.sisa_tagihan));
  const [metode, setMetode] = useState('transfer');
  const [bukti, setBukti] = useState<BuktiFile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const amount = parseInt(nominal.replace(/\D/g, ''), 10) || 0;

  const pick = async () => {
    try {
      const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.8});
      const a = res.assets?.[0];
      if (res.errorMessage) {
        toast.error('Gagal membuka galeri');
      } else if (a?.fileSize && a.fileSize > 5 * 1024 * 1024) {
        toast.error('Ukuran bukti maksimal 5 MB');
      } else if (a?.uri) {
        setBukti({uri: a.uri, name: a.fileName ?? 'bukti.jpg', type: a.type ?? 'image/jpeg'});
        setErrors(e => ({...e, bukti: ''}));
      }
    } catch {
      // modul native belum terpasang: aplikasi perlu di-build ulang
      toast.error('Galeri belum tersedia. Build ulang aplikasi (run-android).');
    }
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (amount < 1) {
      e.nominal = 'Nominal wajib diisi';
    } else if (amount > tagihan.sisa_tagihan) {
      e.nominal = `Melebihi sisa tagihan (${rupiah(tagihan.sisa_tagihan)})`;
    }
    if (isWali && !bukti) {
      e.bukti = 'Bukti pembayaran wajib diunggah';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setSaving(true);
    try {
      const res = await bayarTagihan(
        {tagihan_id: tagihan.id, nominal_bayar: amount, metode_pembayaran: metode},
        bukti,
      );
      toast.success(res.message || 'Pembayaran berhasil disimpan');
      onSaved();
    } catch (err) {
      toast.error(describeError(err) || 'Gagal menyimpan pembayaran');
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
          <Text className="ml-3 text-title text-brand-foreground">Bayar Tagihan</Text>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          {tagihan.nama} · {tagihan.santri?.nama_lengkap}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View className="gap-5 rounded-card bg-surface p-5">
          <View>
            <Text className="text-caption text-ink-muted">Sisa tagihan</Text>
            <Text className="text-heading text-ink">{rupiah(tagihan.sisa_tagihan)}</Text>
          </View>

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Nominal bayar</Text>
            <TextInput
              value={amount ? rupiah(amount).replace('Rp ', '') : ''}
              onChangeText={v => {
                setNominal(v);
                setErrors(er => ({...er, nominal: ''}));
              }}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="number-pad"
              className="h-12 rounded-card border border-line bg-field px-4 text-body text-ink"
            />
            {errors.nominal ? (
              <Text className="mt-1 text-caption text-destructive">{errors.nominal}</Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Metode pembayaran</Text>
            <View className="flex-row gap-2">
              {METODE.map(m => {
                const active = metode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMetode(m.key)}
                    className={`h-10 items-center justify-center rounded-full px-4 ${
                      active ? 'bg-brand' : 'bg-field'
                    }`}>
                    <Text
                      className={`text-label font-medium ${
                        active ? 'text-brand-foreground' : 'text-ink-muted'
                      }`}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
              <Text className="mb-1.5 text-label font-medium text-ink">
                Bukti pembayaran{isWali ? '' : ' (opsional)'}
              </Text>
              {bukti ? (
                <View>
                  <Image
                    source={{uri: bukti.uri}}
                    className="h-56 w-full rounded-card bg-field"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setBukti(null)}
                    hitSlop={10}
                    className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60">
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pick}
                  className="h-32 items-center justify-center rounded-card border border-dashed border-line bg-field">
                  <ImagePlus size={28} color={colors.brand.DEFAULT} />
                  <Text className="mt-2 text-label text-ink-muted">Pilih foto bukti</Text>
                </Pressable>
              )}
              {errors.bukti ? (
                <Text className="mt-1 text-caption text-destructive">{errors.bukti}</Text>
              ) : null}
              <Text className="mt-1.5 text-caption text-ink-muted">JPG atau PNG, maksimal 5 MB</Text>
            </View>

          <Button title={isWali ? 'Kirim pembayaran' : 'Simpan pembayaran'} loading={saving} onPress={submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
