import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, CalendarDays, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {Select} from '@/components/ui/Select';
import {colors} from '@/theme';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';

export type PelanggaranFilter = {
  santri: {id: number; nama: string} | null;
  jenisId: number | null;
  tanggal: string | null; // YYYY-MM-DD
};

export const EMPTY_FILTER: PelanggaranFilter = {santri: null, jenisId: null, tanggal: null};

type Props = {
  visible: boolean;
  value: PelanggaranFilter;
  jenisOptions: {id: number; nama: string}[];
  onClose: () => void;
  onApply: (value: PelanggaranFilter) => void;
};

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export function PelanggaranFilterSheet({visible, value, jenisOptions, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'santri' | 'tanggal'>('main');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  const title = page === 'main' ? 'Filter' : page === 'santri' ? 'Pilih Santri' : 'Pilih Tanggal';

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {page !== 'main' ? (
        <Pressable
          onPress={() => setPage('main')}
          hitSlop={10}
          className="mb-3 flex-row items-center self-start">
          <ArrowLeft size={16} color={colors.brand.DEFAULT} />
          <Text className="ml-1 text-label font-medium text-brand">Kembali</Text>
        </Pressable>
      ) : null}

      {page === 'santri' ? (
        <SantriPicker
          onPick={s => {
            setDraft(d => ({...d, santri: {id: s.id, nama: s.nama_lengkap}}));
            setPage('main');
          }}
        />
      ) : page === 'tanggal' ? (
        <View className="pb-2">
          <CalendarPicker
            value={draft.tanggal}
            onChange={t => {
              setDraft(d => ({...d, tanggal: t}));
              setPage('main');
            }}
          />
        </View>
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
              label="Jenis Pelanggaran"
              placeholder="Semua jenis"
              value={draft.jenisId}
              onChange={jenisId => setDraft(d => ({...d, jenisId}))}
              options={[
                {value: null, label: 'Semua jenis'},
                ...jenisOptions.map(j => ({value: j.id, label: j.nama})),
              ]}
            />
            <PickerField
              icon={CalendarDays}
              label="Tanggal"
              value={draft.tanggal ? dateId(draft.tanggal) : null}
              placeholder="Semua tanggal"
              onPress={() => setPage('tanggal')}
              onClear={() => setDraft(d => ({...d, tanggal: null}))}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button title="Reset" variant="outline" onPress={() => setDraft(EMPTY_FILTER)} />
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
