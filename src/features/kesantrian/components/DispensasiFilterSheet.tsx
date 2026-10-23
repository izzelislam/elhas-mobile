import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';

export type DispensasiFilter = {
  santri: {id: number; nama: string} | null;
  status: string | null;
  jenis: string | null;
};

export const EMPTY_DISPENSASI_FILTER: DispensasiFilter = {santri: null, status: null, jenis: null};

export const label = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');

type Props = {
  visible: boolean;
  value: DispensasiFilter;
  statusOptions: string[]; // diambil dari data; API belum menyediakan daftar
  jenisOptions: string[];
  onClose: () => void;
  onApply: (value: DispensasiFilter) => void;
};

export function DispensasiFilterSheet({
  visible,
  value,
  statusOptions,
  jenisOptions,
  onClose,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [pickSantri, setPickSantri] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPickSantri(false);
    }
  }, [visible, value]);

  const toOptions = (all: string, list: string[]) =>
    [{value: null as string | null, label: all}].concat(
      list.map(s => ({value: s, label: label(s)})),
    );
  const status = useMemo(() => toOptions('Semua status', statusOptions), [statusOptions]);
  const jenis = useMemo(() => toOptions('Semua jenis', jenisOptions), [jenisOptions]);

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
              label="Status"
              value={draft.status}
              options={status}
              onChange={v => setDraft(d => ({...d, status: v}))}
            />
            <Select
              label="Jenis"
              value={draft.jenis}
              options={jenis}
              onChange={v => setDraft(d => ({...d, jenis: v}))}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => setDraft(EMPTY_DISPENSASI_FILTER)}
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
