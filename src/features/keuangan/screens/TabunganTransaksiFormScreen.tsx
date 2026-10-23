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
import {ArrowLeft} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {createTransaksi} from '../services/tabungan.service';
import type {TabunganDetail} from '../types';

export type Tipe = 'masuk' | 'keluar';

/** Setoran (masuk) atau penarikan (keluar) pada satu rekening tabungan. */
export default function TabunganTransaksiFormScreen({
  tabungan,
  onBack,
  onSaved,
  fixedTipe,
}: {
  tabungan: TabunganDetail;
  fixedTipe?: Tipe; // mengunci jenis transaksi (mis. menu Tarik Tabungan)
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [tipe, setTipe] = useState<Tipe>(fixedTipe ?? 'masuk');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const amount = parseInt(nominal.replace(/\D/g, ''), 10) || 0;
  const saldo = Number(tabungan.saldo);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (amount < 1) {
      e.nominal = 'Nominal wajib diisi';
    } else if (tipe === 'keluar' && amount > saldo) {
      e.nominal = `Melebihi saldo (${rupiah(saldo)})`;
    }
    if (!keterangan.trim()) {
      e.keterangan = 'Keterangan wajib diisi';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setSaving(true);
    try {
      const res = await createTransaksi({
        tabungan_id: tabungan.id,
        tipe,
        nominal: amount,
        keterangan: keterangan.trim(),
      });
      toast.success(res.message || 'Transaksi berhasil disimpan');
      onSaved();
    } catch (err) {
      toast.error(describeError(err) || 'Gagal menyimpan transaksi');
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
            {fixedTipe === 'keluar' ? 'Tarik Tabungan' : 'Transaksi Tabungan'}
          </Text>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          {tabungan.santri?.nama_lengkap} · {tabungan.no_rekening}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
        showsVerticalScrollIndicator={false}>
        <View className="gap-5 rounded-card bg-surface p-5">
          {fixedTipe ? null : (
          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Jenis transaksi</Text>
            <View className="flex-row rounded-card bg-field p-1">
              {(
                [
                  {key: 'masuk', label: 'Setoran'},
                  {key: 'keluar', label: 'Penarikan'},
                ] as {key: Tipe; label: string}[]
              ).map(o => {
                const active = tipe === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setTipe(o.key)}
                    className={`flex-1 items-center rounded-card py-2.5 ${
                      active ? 'bg-surface' : ''
                    }`}>
                    <Text
                      className={`text-label font-medium ${
                        active ? 'text-brand' : 'text-ink-muted'
                      }`}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          )}
          <Text className="text-label text-ink-muted">Saldo saat ini {rupiah(saldo)}</Text>

          <View>
            <Text className="mb-1.5 text-label font-medium text-ink">Nominal</Text>
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
            <Text className="mb-1.5 text-label font-medium text-ink">Keterangan</Text>
            <TextInput
              value={keterangan}
              onChangeText={v => {
                setKeterangan(v);
                setErrors(er => ({...er, keterangan: ''}));
              }}
              placeholder="Mis. Setoran dari orang tua"
              placeholderTextColor={colors.text.muted}
              multiline
              textAlignVertical="top"
              className="min-h-[80px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
            />
            {errors.keterangan ? (
              <Text className="mt-1 text-caption text-destructive">{errors.keterangan}</Text>
            ) : null}
          </View>

          <Button title="Simpan" loading={saving} onPress={submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
