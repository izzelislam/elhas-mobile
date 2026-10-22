import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, CalendarDays, CalendarRange, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {MonthPicker} from '@/components/ui/MonthPicker';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';

export type RekapFilter = {
  santri: {id: number; nama: string} | null;
  bulan: string | null; // YYYY-MM
  tanggalMulai: string | null; // YYYY-MM-DD
  tanggalSelesai: string | null; // YYYY-MM-DD
};

export const EMPTY_REKAP_FILTER: RekapFilter = {
  santri: null,
  bulan: null,
  tanggalMulai: null,
  tanggalSelesai: null,
};

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const monthId = (v: string) =>
  new Date(v + '-01T00:00:00').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});

type Page = 'main' | 'santri' | 'bulan' | 'mulai' | 'selesai';

const TITLES: Record<Page, string> = {
  main: 'Filter',
  santri: 'Pilih Santri',
  bulan: 'Pilih Bulan',
  mulai: 'Tanggal Mulai',
  selesai: 'Tanggal Selesai',
};

type Props = {
  visible: boolean;
  value: RekapFilter;
  onClose: () => void;
  onApply: (value: RekapFilter) => void;
};

/** Bulan dan rentang tanggal saling menggantikan: memilih salah satu mengosongkan yang lain. */
export function RekapFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<Page>('main');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  const pickDate = (t: string) => {
    setDraft(d =>
      page === 'mulai'
        ? {
            ...d,
            bulan: null,
            tanggalMulai: t,
            tanggalSelesai: d.tanggalSelesai && d.tanggalSelesai < t ? t : d.tanggalSelesai,
          }
        : {
            ...d,
            bulan: null,
            tanggalSelesai: t,
            tanggalMulai: d.tanggalMulai && d.tanggalMulai > t ? t : d.tanggalMulai,
          },
    );
    setPage('main');
  };

  return (
    <BottomSheet visible={visible} title={TITLES[page]} onClose={onClose}>
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
      ) : page === 'bulan' ? (
        <View className="pb-2">
          <MonthPicker
            value={draft.bulan}
            onChange={b => {
              setDraft(d => ({...d, bulan: b, tanggalMulai: null, tanggalSelesai: null}));
              setPage('main');
            }}
          />
        </View>
      ) : page === 'mulai' || page === 'selesai' ? (
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
            <PickerField
              icon={User}
              label="Santri"
              value={draft.santri?.nama ?? null}
              placeholder="Semua santri"
              onPress={() => setPage('santri')}
              onClear={() => setDraft(d => ({...d, santri: null}))}
            />
            <PickerField
              icon={CalendarRange}
              label="Bulan"
              value={draft.bulan ? monthId(draft.bulan) : null}
              placeholder="Pilih bulan"
              onPress={() => setPage('bulan')}
              onClear={() => setDraft(d => ({...d, bulan: null}))}
            />
            <View className="flex-row items-center">
              <View className="h-px flex-1 bg-line" />
              <Text className="mx-3 text-caption text-ink-muted">atau rentang tanggal</Text>
              <View className="h-px flex-1 bg-line" />
            </View>
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
                onPress={() => setDraft(EMPTY_REKAP_FILTER)}
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
