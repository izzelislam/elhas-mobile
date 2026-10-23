import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {
  Kelas,
  getCachedReferensi,
  loadReferensi,
} from '@/features/santri/services/referensi.service';

export type JadwalFilter = {
  kelasId: number | null;
  semester: string | null;
};

export const EMPTY_JADWAL_FILTER: JadwalFilter = {
  kelasId: null,
  semester: null,
};

export const HARI = [
  'senin',
  'selasa',
  'rabu',
  'kamis',
  'jumat',
  'sabtu',
  'minggu',
];
export const hariLabel = (h: string) => h.charAt(0).toUpperCase() + h.slice(1);

const SEMESTER_OPTIONS = [
  {value: null as string | null, label: 'Semua semester'},
  {value: 'ganjil', label: 'Ganjil'},
  {value: 'genap', label: 'Genap'},
];

type Props = {
  visible: boolean;
  value: JadwalFilter;
  onClose: () => void;
  onApply: (value: JadwalFilter) => void;
};

export function JadwalFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [kelas, setKelas] = useState<Kelas[]>(
    getCachedReferensi()?.kelas ?? [],
  );

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  useEffect(() => {
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => setKelas(ref.kelas))
        .catch(() => {}); // filter kelas kosong bila gagal; filter lain tetap berfungsi
    }
  }, []);

  const kelasOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua kelas'}].concat(
        kelas.map(k => ({value: k.id, label: k.nama})),
      ),
    [kelas],
  );

  return (
    <BottomSheet visible={visible} title="Filter" onClose={onClose}>
      <View className="gap-4 pb-1">
        <Select<number | null>
          label="Kelas"
          placeholder="Semua kelas"
          value={draft.kelasId}
          onChange={kelasId => setDraft(d => ({...d, kelasId}))}
          options={kelasOptions}
        />
        <Select<string | null>
          label="Semester"
          placeholder="Semua semester"
          value={draft.semester}
          onChange={semester => setDraft(d => ({...d, semester}))}
          options={SEMESTER_OPTIONS}
        />
      </View>
      <View className="mt-5 flex-row gap-3">
        <View className="flex-1">
          <Button
            title="Reset"
            variant="outline"
            onPress={() => {
              onApply(EMPTY_JADWAL_FILTER);
              onClose();
            }}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Terapkan"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
