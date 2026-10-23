import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';
import {TahunAjaran, getTahunAjaranList} from '../services/tagihan.service';

export type TagihanFilter = {
  santri: {id: number; nama: string} | null;
  tahunAjaranId: number | null;
  status: string | null;
};

export const EMPTY_TAGIHAN_FILTER: TagihanFilter = {santri: null, tahunAjaranId: null, status: null};

const STATUS = [
  {value: null as string | null, label: 'Semua status'},
  {value: 'belum_bayar', label: 'Belum bayar'},
  {value: 'sebagian', label: 'Dibayar sebagian'},
  {value: 'lunas', label: 'Lunas'},
];

type Props = {
  visible: boolean;
  value: TagihanFilter;
  onClose: () => void;
  onApply: (value: TagihanFilter) => void;
};

export function TagihanFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [pickSantri, setPickSantri] = useState(false);
  const [tahun, setTahun] = useState<TahunAjaran[]>([]);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPickSantri(false);
    }
  }, [visible, value]);

  useEffect(() => {
    getTahunAjaranList()
      .then(setTahun)
      .catch(() => {}); // pilihan tahun ajaran kosong bila gagal; filter lain tetap berfungsi
  }, []);

  const tahunOptions = useMemo(
    () => [
      {value: null as number | null, label: 'Semua tahun ajaran'},
      ...tahun.map(t => ({value: t.id, label: t.is_aktif ? `${t.nama} (aktif)` : t.nama})),
    ],
    [tahun],
  );

  return (
    <BottomSheet visible={visible} title={pickSantri ? 'Pilih Santri' : 'Filter'} onClose={onClose}>
      {pickSantri ? (
        <>
          <Pressable
            onPress={() => setPickSantri(false)}
            hitSlop={10}
            className="mb-3 flex-row items-center self-start">
            <ArrowLeft size={16} color={colors.brand.DEFAULT} />
            <Text className="ml-1 text-label font-medium text-brand">Kembali</Text>
          </Pressable>
          <SantriPicker
            onPick={s => {
              setDraft(d => ({...d, santri: {id: s.id, nama: s.nama_lengkap}}));
              setPickSantri(false);
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
              onPress={() => setPickSantri(true)}
              onClear={() => setDraft(d => ({...d, santri: null}))}
            />
            <Select
              label="Tahun ajaran"
              value={draft.tahunAjaranId}
              options={tahunOptions}
              onChange={v => setDraft(d => ({...d, tahunAjaranId: v}))}
            />
            <Select
              label="Status"
              value={draft.status}
              options={STATUS}
              onChange={v => setDraft(d => ({...d, status: v}))}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button title="Reset" variant="outline" onPress={() => setDraft(EMPTY_TAGIHAN_FILTER)} />
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
