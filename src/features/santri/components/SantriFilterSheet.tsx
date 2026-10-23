import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {Kelas, getCachedReferensi, loadReferensi} from '../services/referensi.service';

export type SantriFilter = {status: string; kelasId: number | null};

export const DEFAULT_SANTRI_FILTER: SantriFilter = {status: 'aktif', kelasId: null};

const STATUS_OPTIONS = [
  {value: 'aktif', label: 'Aktif'},
  {value: 'alumni', label: 'Alumni'},
  {value: 'pindah', label: 'Pindah'},
  {value: 'dikeluarkan', label: 'Dikeluarkan'},
  {value: 'cuti', label: 'Cuti'},
  {value: 'all', label: 'Semua status'},
];

type Props = {
  visible: boolean;
  value: SantriFilter;
  onClose: () => void;
  onApply: (value: SantriFilter) => void;
};

export function SantriFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [kelas, setKelas] = useState<Kelas[]>(getCachedReferensi()?.kelas ?? []);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  useEffect(() => {
    if (getCachedReferensi()) {
      return;
    }
    loadReferensi()
      .then(ref => setKelas(ref.kelas))
      .catch(() => {}); // filter kelas kosong bila gagal; filter status tetap berfungsi
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
        <Select
          label="Status"
          value={draft.status}
          options={STATUS_OPTIONS}
          onChange={v => setDraft(d => ({...d, status: v}))}
        />
        <Select
          label="Kelas"
          value={draft.kelasId}
          options={kelasOptions}
          onChange={v => setDraft(d => ({...d, kelasId: v}))}
        />
      </View>
      <View className="mt-5 flex-row gap-3">
        <View className="flex-1">
          <Button
            title="Reset"
            variant="outline"
            onPress={() => setDraft(DEFAULT_SANTRI_FILTER)}
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
