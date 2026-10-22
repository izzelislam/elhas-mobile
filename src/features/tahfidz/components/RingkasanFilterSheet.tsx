import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, CalendarDays} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {colors} from '@/theme';

export type RingkasanFilter = {
  halaqahId: number | null;
  tanggalMulai: string | null; // YYYY-MM-DD
  tanggalSelesai: string | null; // YYYY-MM-DD
};

export const EMPTY_RINGKASAN_FILTER: RingkasanFilter = {
  halaqahId: null,
  tanggalMulai: null,
  tanggalSelesai: null,
};

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

type Props = {
  visible: boolean;
  value: RingkasanFilter;
  halaqahOptions: {id: number; nama: string}[];
  onClose: () => void;
  onApply: (value: RingkasanFilter) => void;
};

export function RingkasanFilterSheet({visible, value, halaqahOptions, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'mulai' | 'selesai'>('main');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  const title =
    page === 'main' ? 'Filter' : page === 'mulai' ? 'Tanggal Mulai' : 'Tanggal Selesai';

  const pickDate = (t: string) => {
    setDraft(d =>
      page === 'mulai'
        ? {...d, tanggalMulai: t, tanggalSelesai: d.tanggalSelesai && d.tanggalSelesai < t ? t : d.tanggalSelesai}
        : {...d, tanggalSelesai: t, tanggalMulai: d.tanggalMulai && d.tanggalMulai > t ? t : d.tanggalMulai},
    );
    setPage('main');
  };

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

      {page !== 'main' ? (
        <View className="pb-2">
          <CalendarPicker
            key={page}
            value={page === 'mulai' ? draft.tanggalMulai : draft.tanggalSelesai}
            onChange={pickDate}
          />
        </View>
      ) : (
        <>
          <View className="gap-4 pb-1">
            <Select<number | null>
              label="Halaqah"
              placeholder="Semua halaqah"
              value={draft.halaqahId}
              onChange={halaqahId => setDraft(d => ({...d, halaqahId}))}
              options={[
                {value: null, label: 'Semua halaqah'},
                ...halaqahOptions.map(h => ({value: h.id, label: h.nama})),
              ]}
            />
            <PickerField
              icon={CalendarDays}
              label="Tanggal Mulai"
              value={draft.tanggalMulai ? dateId(draft.tanggalMulai) : null}
              placeholder="Dari tanggal"
              onPress={() => setPage('mulai')}
              onClear={() => setDraft(d => ({...d, tanggalMulai: null}))}
            />
            <PickerField
              icon={CalendarDays}
              label="Tanggal Selesai"
              value={draft.tanggalSelesai ? dateId(draft.tanggalSelesai) : null}
              placeholder="Sampai tanggal"
              onPress={() => setPage('selesai')}
              onClear={() => setDraft(d => ({...d, tanggalSelesai: null}))}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => setDraft(EMPTY_RINGKASAN_FILTER)}
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
