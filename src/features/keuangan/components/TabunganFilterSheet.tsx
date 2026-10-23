import React, {useEffect, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {ArrowLeft, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';

export type TabunganFilter = {
  santri: {id: number; nama: string} | null;
  noRekening: string;
};

export const EMPTY_TABUNGAN_FILTER: TabunganFilter = {santri: null, noRekening: ''};

type Props = {
  visible: boolean;
  value: TabunganFilter;
  onClose: () => void;
  onApply: (value: TabunganFilter) => void;
};

export function TabunganFilterSheet({visible, value, onClose, onApply}: Props) {
  const [draft, setDraft] = useState(value);
  const [pickSantri, setPickSantri] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPickSantri(false);
    }
  }, [visible, value]);

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
            <View>
              <Text className="mb-1.5 text-label font-medium text-ink">No. Rekening</Text>
              <TextInput
                value={draft.noRekening}
                onChangeText={v => setDraft(d => ({...d, noRekening: v}))}
                placeholder="Mis. 990100001"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                className="h-12 rounded-card border border-line bg-field px-4 text-body text-ink"
              />
            </View>
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => setDraft(EMPTY_TABUNGAN_FILTER)}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Terapkan"
                onPress={() => {
                  onApply({...draft, noRekening: draft.noRekening.trim()});
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
