import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Select} from '@/components/ui/Select';
import {colors} from '@/theme';
import {useScopeStore} from '@/store/scope.store';
import {
  Kelas,
  Unit,
  getCachedReferensi,
  kelasInUnit,
  loadReferensi,
} from '../services/referensi.service';
import {getSantriList} from '../services/santri.service';
import type {Santri} from '../types';

export function SantriPicker({onPick}: {onPick: (s: Santri) => void}) {
  const scopeUnitIds = useScopeStore(s => s.unitIds);
  const scopeKelasIds = useScopeStore(s => s.kelasIds);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>(getCachedReferensi()?.units ?? []);
  const [kelasList, setKelasList] = useState<Kelas[]>(getCachedReferensi()?.kelas ?? []);
  const [pickedUnit, setPickedUnit] = useState<number | null>(null);
  const [pickedKelas, setPickedKelas] = useState<number | null>(null);

  useEffect(() => {
    if (getCachedReferensi()) {
      return;
    }
    loadReferensi()
      .then(ref => {
        setUnits(ref.units);
        setKelasList(ref.kelas);
      })
      .catch(() => {}); // filter unit/kelas kosong bila gagal; pencarian nama tetap berfungsi
  }, []);

  // Unit dan kelas yang boleh dipilih mengikuti pengaturan di menu Akun → Unit & Kelas.
  const unitOptions = useMemo(
    () => units.filter(u => scopeUnitIds.length === 0 || scopeUnitIds.includes(u.id)),
    [units, scopeUnitIds],
  );
  const unitId = unitOptions.length === 1 ? unitOptions[0].id : pickedUnit;

  const kelasPool = useMemo(() => {
    const unit = units.find(u => u.id === unitId);
    return kelasList.filter(k => {
      if (scopeKelasIds.length > 0 && !scopeKelasIds.includes(k.id)) {
        return false;
      }
      if (unit) {
        return kelasInUnit(k, unit);
      }
      return unitOptions.length === units.length || unitOptions.some(u => kelasInUnit(k, u));
    });
  }, [kelasList, units, unitOptions, unitId, scopeKelasIds]);

  // API hanya menerima satu kelas_id: saat pilihan dibatasi, "Semua kelas" tidak tersedia
  const restricted = kelasList.length > 0 && kelasPool.length < kelasList.length;
  const kelasId =
    kelasPool.length === 1
      ? kelasPool[0].id
      : pickedKelas !== null && kelasPool.some(k => k.id === pickedKelas)
      ? pickedKelas
      : restricted
      ? kelasPool[0]?.id ?? null
      : null;

  const showUnit = unitOptions.length > 1;
  const showKelas = kelasPool.length > 1;

  useEffect(() => {
    if (restricted && kelasId === null) {
      // pilihan dibatasi tetapi tidak ada kelas yang tersedia: jangan tampilkan santri dari luar pengaturan
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      getSantriList({
        status: 'all',
        search: search.trim() || undefined,
        kelas_id: kelasId ?? undefined,
        per_page: 20,
      })
        .then(res => setItems(res.data))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [search, kelasId, restricted]);

  return (
    <View>
      {showUnit || showKelas ? (
        <View className="mb-2 flex-row gap-2">
          {showUnit ? (
            <View className="flex-1">
              <Select<number | null>
                placeholder="Semua unit"
                value={unitId}
                onChange={id => {
                  setPickedUnit(id);
                  setPickedKelas(null);
                }}
                options={[
                  {value: null, label: 'Semua unit'},
                  ...unitOptions.map(u => ({value: u.id, label: u.singkatan ?? u.nama})),
                ]}
              />
            </View>
          ) : null}
          {showKelas ? (
            <View className="flex-1">
              <Select<number | null>
                placeholder="Semua kelas"
                value={kelasId}
                onChange={setPickedKelas}
                options={[
                  ...(restricted ? [] : [{value: null, label: 'Semua kelas'}]),
                  ...kelasPool.map(k => ({value: k.id, label: k.nama})),
                ]}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      <View className="flex-row items-center rounded-card bg-field px-3">
        <Search size={18} color={colors.brand.DEFAULT} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama santri"
          className="ml-2 h-11 flex-1 text-body text-ink"
        />
      </View>
      <View style={{height: 280}} className="mt-2">
        {loading ? (
          <ActivityIndicator className="mt-8" color={colors.brand.DEFAULT} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={s => String(s.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="mt-8 text-center text-label text-ink-muted">
                Santri tidak ditemukan
              </Text>
            }
            renderItem={({item}) => (
              <Pressable
                onPress={() => onPick(item)}
                className="flex-row items-center py-2.5 active:opacity-70">
                <Avatar name={item.nama_lengkap} size={38} />
                <View className="ml-3 flex-1">
                  <Text className="text-label font-medium text-ink" numberOfLines={1}>
                    {item.nama_lengkap}
                  </Text>
                  <Text className="text-caption text-ink-muted">NIS {item.nis}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}
