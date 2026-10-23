import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Switch,
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
import {Card} from '@/components/ui/Card';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {MutabaahVariant, createMutabaah, getIndikator} from '../services/mutabaah.service';
import type {Indikator} from '../types';

type ItemState = {dikerjakan: boolean; catatan: string; showCatatan: boolean};

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
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
      (err.response ? 'Gagal menyimpan mutabaah' : 'Tidak dapat terhubung ke server')
    );
  }
  return 'Terjadi kesalahan, coba lagi';
}

export default function MutabaahSantriFormScreen({
  onBack,
  onSaved,
  variant = 'santri',
}: {
  onBack: () => void;
  onSaved: () => void;
  variant?: MutabaahVariant;
}) {
  const isSantri = variant === 'santri';
  const insets = useSafeAreaInsets();
  const [indikator, setIndikator] = useState<Indikator[]>([]);
  const [items, setItems] = useState<Record<number, ItemState>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [santri, setSantri] = useState<{id: number; nama: string} | null>(null);
  const [tanggal, setTanggal] = useState(todayKey());
  const [santriError, setSantriError] = useState('');
  const [sheet, setSheet] = useState<'santri' | 'tanggal' | null>(null);
  const [saving, setSaving] = useState(false);

  const loadIndikator = useCallback(async () => {
    setLoading(true);
    try {
      const list = (await getIndikator(variant)).sort((a, b) => a.urutan - b.urutan);
      setIndikator(list);
      setItems(
        Object.fromEntries(
          list.map(i => [i.id, {dikerjakan: false, catatan: '', showCatatan: false}]),
        ),
      );
      setFailed(false);
    } catch (err) {
      setFailed(true);
      const detail = describeError(err);
      console.warn('Indikator mutabaah gagal', err);
      toast.error(detail ? `Gagal memuat indikator (${detail})` : 'Gagal memuat indikator mutabaah');
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    loadIndikator();
  }, [loadIndikator]);

  const patch = (id: number, change: Partial<ItemState>) =>
    setItems(prev => ({...prev, [id]: {...prev[id], ...change}}));

  const doneCount = indikator.filter(i => items[i.id]?.dikerjakan).length;
  const allDone = indikator.length > 0 && doneCount === indikator.length;

  const toggleAll = () =>
    setItems(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([id, st]) => [id, {...st, dikerjakan: !allDone}]),
      ),
    );

  const submit = async () => {
    if (isSantri && !santri) {
      setSantriError('Santri wajib dipilih');
      return;
    }
    setSaving(true);
    try {
      const res = await createMutabaah(variant, {
        tanggal,
        subjek_id: santri?.id,
        items: indikator.map(i => ({
          indikator_id: i.id,
          dikerjakan: items[i.id]?.dikerjakan ?? false,
          catatan: items[i.id]?.catatan.trim() || null,
        })),
      });
      toast.success(res.message || 'Mutabaah berhasil disimpan');
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
          <Text className="ml-3 text-title text-brand-foreground">{isSantri ? 'Input Mutabaah Santri' : 'Input Mutabaah Asatidzah'}</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 100}}
        showsVerticalScrollIndicator={false}>
        <View className="gap-5 rounded-card bg-surface p-5">
          {isSantri ? (
          <View>
            <PickerField
              icon={User}
              label="Santri"
              value={santri?.nama ?? null}
              placeholder="Pilih santri"
              onPress={() => setSheet('santri')}
              onClear={() => setSantri(null)}
            />
            {santriError ? (
              <Text className="mt-1 text-caption text-destructive">{santriError}</Text>
            ) : null}
          </View>
          ) : null}
          <PickerField
            icon={CalendarDays}
            label="Tanggal"
            value={dateId(tanggal)}
            placeholder="Pilih tanggal"
            onPress={() => setSheet('tanggal')}
            onClear={() => setTanggal(todayKey())}
          />
        </View>

        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.brand.DEFAULT} />
        ) : failed ? (
          <View className="mt-10 items-center">
            <Text className="mb-4 text-center text-body text-ink-muted">
              Indikator tidak dapat dimuat
            </Text>
            <Button title="Coba lagi" onPress={loadIndikator} />
          </View>
        ) : (
          <>
            <View className="mb-2 ml-1 mt-5 flex-row items-center justify-between">
              <Text className="text-caption font-medium tracking-wide text-ink-muted">
                INDIKATOR · {doneCount}/{indikator.length} DIKERJAKAN
              </Text>
              <Pressable onPress={toggleAll} hitSlop={8}>
                <Text className="text-label font-medium text-brand">
                  {allDone ? 'Kosongkan semua' : 'Tandai semua'}
                </Text>
              </Pressable>
            </View>

            {indikator.map(i => {
              const st = items[i.id];
              return (
                <Card key={i.id} className="mb-2 border-0 p-4">
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-3">
                      <Text className="text-body font-semibold text-ink">{i.nama}</Text>
                      {i.deskripsi ? (
                        <Text className="mt-0.5 text-caption text-ink-muted">{i.deskripsi}</Text>
                      ) : null}
                    </View>
                    <Switch
                      value={st?.dikerjakan ?? false}
                      onValueChange={v => patch(i.id, {dikerjakan: v})}
                      trackColor={{true: colors.brand.DEFAULT, false: undefined}}
                    />
                  </View>
                  {st?.showCatatan ? (
                    <TextInput
                      value={st.catatan}
                      onChangeText={v => patch(i.id, {catatan: v})}
                      placeholder="Catatan"
                      placeholderTextColor={colors.text.muted}
                      className="mt-3 h-11 rounded-card border border-line bg-field px-3 text-label text-ink"
                    />
                  ) : (
                    <Pressable
                      onPress={() => patch(i.id, {showCatatan: true})}
                      hitSlop={8}
                      className="mt-2 self-start">
                      <Text className="text-caption font-medium text-brand">
                        {st?.catatan ? `Catatan: ${st.catatan}` : '+ Tambah catatan'}
                      </Text>
                    </Pressable>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {!loading && !failed ? (
        <View
          style={{bottom: insets.bottom + 16}}
          className="absolute left-5 right-5 rounded-card shadow-lg">
          <Button title="Simpan" loading={saving} onPress={submit} />
        </View>
      ) : null}

      <BottomSheet
        visible={sheet === 'santri'}
        title="Pilih Santri"
        onClose={() => setSheet(null)}>
        <SantriPicker
          onPick={s => {
            setSantri({id: s.id, nama: s.nama_lengkap});
            setSantriError('');
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
