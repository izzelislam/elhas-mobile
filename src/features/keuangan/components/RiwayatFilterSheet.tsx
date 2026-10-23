import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, Calendar, User} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {SantriPicker} from '@/features/santri/components/SantriPicker';
import {colors} from '@/theme';

export type RiwayatFilter = {
  santri: {id: number; nama: string} | null;
  mulai: string | null; // YYYY-MM-DD
  selesai: string | null;
};

export const EMPTY_RIWAYAT_FILTER: RiwayatFilter = {santri: null, mulai: null, selesai: null};

type Step = 'main' | 'santri' | 'mulai' | 'selesai';

const TITLE: Record<Step, string> = {
  main: 'Filter',
  santri: 'Pilih Santri',
  mulai: 'Tanggal Mulai',
  selesai: 'Tanggal Selesai',
};

const fmt = (v: string | null) =>
  v
    ? new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

type Props = {
  visible: boolean;
  value: RiwayatFilter;
  onClose: () => void;
  onApply: (value: RiwayatFilter) => void;
  showSantri?: boolean;
};

export function RiwayatFilterSheet({visible, value, onClose, onApply, showSantri = true}: Props) {
  const [draft, setDraft] = useState(value);
  const [step, setStep] = useState<Step>('main');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setStep('main');
    }
  }, [visible, value]);

  const back = (
    <Pressable
      onPress={() => setStep('main')}
      hitSlop={10}
      className="mb-3 flex-row items-center self-start">
      <ArrowLeft size={16} color={colors.brand.DEFAULT} />
      <Text className="ml-1 text-label font-medium text-brand">Kembali</Text>
    </Pressable>
  );

  const rangeInvalid = !!draft.mulai && !!draft.selesai && draft.mulai > draft.selesai;

  return (
    <BottomSheet visible={visible} title={TITLE[step]} onClose={onClose}>
      {step === 'santri' ? (
        <>
          {back}
          <SantriPicker
            onPick={s => {
              setDraft(d => ({...d, santri: {id: s.id, nama: s.nama_lengkap}}));
              setStep('main');
            }}
          />
        </>
      ) : step === 'mulai' || step === 'selesai' ? (
        <>
          {back}
          <CalendarPicker
            value={draft[step]}
            onChange={v => {
              setDraft(d => ({...d, [step]: v}));
              setStep('main');
            }}
          />
        </>
      ) : (
        <>
          <View className="gap-4 pb-1">
            {showSantri ? (
            <PickerField
              icon={User}
              label="Santri"
              value={draft.santri?.nama ?? null}
              placeholder="Semua santri"
              onPress={() => setStep('santri')}
              onClear={() => setDraft(d => ({...d, santri: null}))}
            />
            ) : null}
            <PickerField
              icon={Calendar}
              label="Tanggal mulai"
              value={fmt(draft.mulai)}
              placeholder="Pilih tanggal"
              onPress={() => setStep('mulai')}
              onClear={() => setDraft(d => ({...d, mulai: null}))}
            />
            <PickerField
              icon={Calendar}
              label="Tanggal selesai"
              value={fmt(draft.selesai)}
              placeholder="Pilih tanggal"
              onPress={() => setStep('selesai')}
              onClear={() => setDraft(d => ({...d, selesai: null}))}
            />
            {rangeInvalid ? (
              <Text className="text-caption text-destructive">
                Tanggal mulai harus sebelum tanggal selesai
              </Text>
            ) : null}
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => setDraft(EMPTY_RIWAYAT_FILTER)}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Terapkan"
                disabled={rangeInvalid}
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
