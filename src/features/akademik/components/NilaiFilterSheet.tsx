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
  Unit,
  getCachedReferensi,
  kelasInUnit,
  loadReferensi,
} from '@/features/santri/services/referensi.service';
import {colors} from '@/theme';
import {
  MataPelajaran,
  getCachedMataPelajaran,
  loadMataPelajaran,
} from '../services/jadwal.service';
import {getTahunAjaran} from '../services/kalender.service';
import type {TahunAjaran} from '../types';

export type NilaiFilter = {
  santri: {id: number; nama: string} | null;
  unitId: number | null;
  kelasId: number | null;
  tahunAjaranId: number | null;
  mapelId: number | null;
  jenis: string | null;
};

export const EMPTY_NILAI_FILTER: NilaiFilter = {
  santri: null,
  unitId: null,
  kelasId: null,
  tahunAjaranId: null,
  mapelId: null,
  jenis: null,
};

export const JENIS = [
  {value: 'harian', label: 'Harian'},
  {value: 'tugas', label: 'Tugas'},
  {value: 'uts', label: 'UTS'},
  {value: 'uas', label: 'UAS'},
  {value: 'lisan', label: 'Lisan'},
];
export const jenisLabel = (v: string) =>
  JENIS.find(j => j.value === v)?.label ?? v;

type Props = {
  visible: boolean;
  value: NilaiFilter;
  onClose: () => void;
  onApply: (value: NilaiFilter) => void;
};

export function NilaiFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'santri'>('main');
  const [tahun, setTahun] = useState<TahunAjaran[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>(
    getCachedMataPelajaran() ?? [],
  );
  const [units, setUnits] = useState<Unit[]>(getCachedReferensi()?.units ?? []);
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
    loadMataPelajaran()
      .then(setMapel)
      .catch(() => {}); // filter mata pelajaran kosong bila gagal; filter lain tetap berfungsi
    getTahunAjaran()
      .then(setTahun)
      .catch(() => {}); // filter tahun ajaran kosong bila gagal; filter lain tetap berfungsi
  }, []);

  useEffect(() => {
    if (!getCachedReferensi()) {
      loadReferensi()
        .then(ref => {
          setUnits(ref.units);
          setKelas(ref.kelas);
        })
        .catch(() => {}); // filter unit/kelas kosong bila gagal; filter lain tetap berfungsi
    }
  }, []);

  const unitOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua unit'}].concat(
        units.map(u => ({value: u.id, label: u.nama})),
      ),
    [units],
  );
  const kelasOptions = useMemo(() => {
    const unit = units.find(u => u.id === draft.unitId);
    const list = draft.unitId ? kelas.filter(k => kelasInUnit(k, unit)) : kelas;
    return [{value: null as number | null, label: 'Semua kelas'}].concat(
      list.map(k => ({value: k.id, label: k.nama})),
    );
  }, [units, kelas, draft.unitId]);

  const tahunOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua tahun ajaran'}].concat(
        tahun.map(t => ({value: t.id, label: t.nama})),
      ),
    [tahun],
  );
  const mapelOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua mata pelajaran'}].concat(
        mapel.map(m => ({value: m.id, label: m.nama})),
      ),
    [mapel],
  );
  const jenisOptions = useMemo(
    () =>
      [{value: null as string | null, label: 'Semua jenis'}].concat(
        JENIS.map(j => ({value: j.value, label: j.label})),
      ),
    [],
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
              setDraft(d => ({
                ...d,
                santri: {id: s.id, nama: s.nama_lengkap},
              }));
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
              label="Unit"
              placeholder="Semua unit"
              value={draft.unitId}
              onChange={unitId =>
                setDraft(d => {
                  const unit = units.find(u => u.id === unitId);
                  const k = kelas.find(x => x.id === d.kelasId);
                  const keep = !unitId || (k && kelasInUnit(k, unit));
                  return {...d, unitId, kelasId: keep ? d.kelasId : null};
                })
              }
              options={unitOptions}
            />
            <Select<number | null>
              label="Kelas"
              placeholder="Semua kelas"
              value={draft.kelasId}
              onChange={kelasId => setDraft(d => ({...d, kelasId}))}
              options={kelasOptions}
            />
            <Select<number | null>
              label="Tahun ajaran"
              placeholder="Semua tahun ajaran"
              value={draft.tahunAjaranId}
              onChange={tahunAjaranId => setDraft(d => ({...d, tahunAjaranId}))}
              options={tahunOptions}
            />
            <Select<number | null>
              label="Mata pelajaran"
              placeholder="Semua mata pelajaran"
              value={draft.mapelId}
              onChange={mapelId => setDraft(d => ({...d, mapelId}))}
              options={mapelOptions}
            />
            <Select<string | null>
              label="Jenis nilai"
              placeholder="Semua jenis"
              value={draft.jenis}
              onChange={jenis => setDraft(d => ({...d, jenis}))}
              options={jenisOptions}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => {
                  onApply(EMPTY_NILAI_FILTER);
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
