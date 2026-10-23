import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {
  Kelas,
  getCachedReferensi,
  loadReferensi,
} from '@/features/santri/services/referensi.service';
import {colors} from '@/theme';
import {getTahunAjaran} from '../services/kalender.service';
import type {TahunAjaran} from '../types';

export type RaporFilter = {
  santri: {id: number; nama: string} | null;
  tahunAjaranId: number | null;
  kelasId: number | null;
};

export const EMPTY_RAPOR_FILTER: RaporFilter = {
  santri: null,
  tahunAjaranId: null,
  kelasId: null,
};

type Props = {
  visible: boolean;
  value: RaporFilter;
  onClose: () => void;
  onApply: (value: RaporFilter) => void;
};

export function RaporFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'santri'>('main');
  const [tahun, setTahun] = useState<TahunAjaran[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>(
    getCachedReferensi()?.kelas ?? [],
  );

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  useEffect(() => {
    getTahunAjaran()
      .then(setTahun)
      .catch(() => {}); // filter tahun ajaran kosong bila gagal; filter lain tetap berfungsi
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => setKelas(ref.kelas))
        .catch(() => {});
    }
  }, []);

  const tahunOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua tahun ajaran'}].concat(
        tahun.map(t => ({value: t.id, label: t.nama})),
      ),
    [tahun],
  );
  const kelasOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua kelas'}].concat(
        kelas.map(k => ({value: k.id, label: k.nama})),
      ),
    [kelas],
  );

  return (
    <BottomSheet
      visible={visible}
      title={page === 'santri' ? 'Pilih Santri' : 'Filter'}
      onClose={onClose}
    >
      {page === 'santri' ? (
        <>
          <Pressable
            onPress={() => setPage('main')}
            hitSlop={10}
            className="mb-3 flex-row items-center self-start"
          >
            <ArrowLeft size={16} color={colors.brand.DEFAULT} />
            <Text className="ml-1 text-label font-medium text-brand">
              Kembali
            </Text>
          </Pressable>
          <SantriPicker
            onPick={s => {
              setDraft(d => ({...d, santri: {id: s.id, nama: s.nama_lengkap}}));
              setPage('main');
            }}
          />
        </>
      ) : (
        <>
          <View className="gap-4 pb-1">
            <PickerField
              icon={User}
              label="Santri"
              value={draft.santri?.nama ?? null}
              placeholder="Semua santri"
              onPress={() => setPage('santri')}
              onClear={() => setDraft(d => ({...d, santri: null}))}
            />
            <Select<number | null>
              label="Tahun ajaran"
              placeholder="Semua tahun ajaran"
              value={draft.tahunAjaranId}
              onChange={tahunAjaranId => setDraft(d => ({...d, tahunAjaranId}))}
              options={tahunOptions}
            />
            <Select<number | null>
              label="Kelas"
              placeholder="Semua kelas"
              value={draft.kelasId}
              onChange={kelasId => setDraft(d => ({...d, kelasId}))}
              options={kelasOptions}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => {
                  onApply(EMPTY_RAPOR_FILTER);
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
        </>
      )}
    </BottomSheet>
  );
}
