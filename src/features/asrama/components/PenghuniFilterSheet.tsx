import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import type {Gedung, Kamar} from '../types';

export type PenghuniFilter = {
  gedungId: number | null;
  kamarId: number | null;
  status: 'aktif' | 'keluar' | null;
};

export const EMPTY_PENGHUNI_FILTER: PenghuniFilter = {
  gedungId: null,
  kamarId: null,
  status: null,
};

type Props = {
  visible: boolean;
  value: PenghuniFilter;
  gedung: Gedung[];
  kamar: Kamar[];
  onClose: () => void;
  onApply: (value: PenghuniFilter) => void;
};

export function PenghuniFilterSheet({visible, value, gedung, kamar, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const gedungOptions = useMemo(
    () => [{value: null as number | null, label: 'Semua gedung'}].concat(
      gedung.map(g => ({value: g.id, label: g.nama})),
    ),
    [gedung],
  );
  const kamarOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua kamar'}].concat(
        kamar
          .filter(k => draft.gedungId === null || k.gedung_asrama_id === draft.gedungId)
          .map(k => ({value: k.id, label: `${k.nomor_kamar} · ${k.nama_kamar}`})),
      ),
    [kamar, draft.gedungId],
  );
  const statusOptions: {value: PenghuniFilter['status']; label: string}[] = [
    {value: null, label: 'Semua status'},
    {value: 'aktif', label: 'Aktif'},
    {value: 'keluar', label: 'Keluar'},
  ];

  return (
    <BottomSheet visible={visible} title="Filter" onClose={onClose}>
      <View className="gap-4 pb-1">
        <Select
          label="Gedung"
          value={draft.gedungId}
          options={gedungOptions}
          onChange={v => setDraft(d => ({...d, gedungId: v, kamarId: null}))}
        />
        <Select
          label="Kamar"
          value={draft.kamarId}
          options={kamarOptions}
          onChange={v => setDraft(d => ({...d, kamarId: v}))}
        />
        <Select
          label="Status"
          value={draft.status}
          options={statusOptions}
          onChange={v => setDraft(d => ({...d, status: v}))}
        />
      </View>
      <View className="mt-5 flex-row gap-3">
        <View className="flex-1">
          <Button title="Reset" variant="outline" onPress={() => setDraft(EMPTY_PENGHUNI_FILTER)} />
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
