import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Check} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {
  Kelas,
  Unit,
  getCachedReferensi,
  kelasInUnit,
  loadReferensi,
} from '@/features/santri/services/referensi.service';
import {colors} from '@/theme';
import {useScopeStore} from '@/store/scope.store';
import {toast} from '@/store/toast.store';

function CheckRow({
  label,
  hint,
  checked,
  onPress,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 active:opacity-70">
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border ${
          checked ? 'border-brand bg-brand' : 'border-line bg-surface'
        }`}>
        {checked ? <Check size={15} color={colors.brand.foreground} strokeWidth={3} /> : null}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-body text-ink">{label}</Text>
        {hint ? <Text className="text-caption text-ink-muted">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function PengaturanScopeScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const {unitIds, kelasIds, setUnitIds, setKelasIds, reset} = useScopeStore();
  const [units, setUnits] = useState<Unit[]>(getCachedReferensi()?.units ?? []);
  const [kelas, setKelas] = useState<Kelas[]>(getCachedReferensi()?.kelas ?? []);
  const [loading, setLoading] = useState(!getCachedReferensi());
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ref = await loadReferensi();
      setUnits(ref.units);
      setKelas(ref.kelas);
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat daftar unit dan kelas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getCachedReferensi()) {
      load();
    }
  }, [load]);

  // kelas yang ditawarkan: milik unit terpilih (atau semua unit bila belum ada yang dipilih)
  const visibleUnits = units.filter(u => unitIds.length === 0 || unitIds.includes(u.id));
  const groups = useMemo(
    () =>
      visibleUnits
        .map(u => ({unit: u, kelas: kelas.filter(k => kelasInUnit(k, u))}))
        .filter(g => g.kelas.length > 0),
    [visibleUnits, kelas],
  );

  const toggleUnit = (id: number) => {
    const next = unitIds.includes(id) ? unitIds.filter(x => x !== id) : [...unitIds, id];
    setUnitIds(next);
    // buang kelas yang tidak lagi termasuk unit terpilih
    if (next.length > 0) {
      const allowed = new Set(
        kelas
          .filter(k => units.some(u => next.includes(u.id) && kelasInUnit(k, u)))
          .map(k => k.id),
      );
      setKelasIds(kelasIds.filter(k => allowed.has(k)));
    }
  };

  const toggleKelas = (id: number) =>
    setKelasIds(kelasIds.includes(id) ? kelasIds.filter(x => x !== id) : [...kelasIds, id]);

  const active = unitIds.length > 0 || kelasIds.length > 0;

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Unit & Kelas</Text>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          Pilih unit dan kelas yang dipakai di aplikasi
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Daftar unit dan kelas tidak dapat dimuat
          </Text>
          <Button title="Coba lagi" onPress={load} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}>
          <Text className="mb-3 text-label text-ink-muted">
            Pilihan di sini menjadi satu-satunya opsi unit dan kelas saat memilih santri. Kalau
            hanya satu unit atau satu kelas yang dipilih, pilihannya otomatis terisi. Kosongkan
            untuk menampilkan semua.
          </Text>

          <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
            UNIT
          </Text>
          <Card className="border-0 px-4 py-1">
            {units.map((u, i) => (
              <View key={u.id}>
                {i > 0 ? <View className="h-px bg-line" /> : null}
                <CheckRow
                  label={u.nama}
                  hint={u.singkatan ?? undefined}
                  checked={unitIds.includes(u.id)}
                  onPress={() => toggleUnit(u.id)}
                />
              </View>
            ))}
          </Card>

          {groups.map(g => (
            <View key={g.unit.id} className="mt-5">
              <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
                KELAS {(g.unit.singkatan ?? g.unit.nama).toUpperCase()}
              </Text>
              <Card className="border-0 px-4 py-1">
                {g.kelas.map((k, i) => (
                  <View key={k.id}>
                    {i > 0 ? <View className="h-px bg-line" /> : null}
                    <CheckRow
                      label={k.nama}
                      hint={`${k.jumlah_santri} santri`}
                      checked={kelasIds.includes(k.id)}
                      onPress={() => toggleKelas(k.id)}
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))}

          {active ? (
            <View className="mt-6">
              <Button title="Tampilkan semua unit & kelas" variant="outline" onPress={reset} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
