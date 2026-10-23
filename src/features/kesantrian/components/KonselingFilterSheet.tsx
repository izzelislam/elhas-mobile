import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';

export type KonselingFilter = {
  santri: {id: number; nama: string} | null;
  status: string | null;
};

export const EMPTY_KONSELING_FILTER: KonselingFilter = {santri: null, status: null};

type Props = {
  visible: boolean;
  value: KonselingFilter;
  statusOptions: string[]; // status yang ada di data; API belum menyediakan daftar status
  onClose: () => void;
  onApply: (value: KonselingFilter) => void;
};

export const statusLabel = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');

export function KonselingFilterSheet({visible, value, statusOptions, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [pickSantri, setPickSantri] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPickSantri(false);
    }
  }, [visible, value]);

  const options = useMemo(
    () =>
      [{value: null as string | null, label: 'Semua status'}].concat(
        statusOptions.map(s => ({value: s, label: statusLabel(s)})),
      ),
    [statusOptions],
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
              label="Status"
              value={draft.status}
              options={options}
              onChange={v => setDraft(d => ({...d, status: v}))}
            />
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => setDraft(EMPTY_KONSELING_FILTER)}
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
