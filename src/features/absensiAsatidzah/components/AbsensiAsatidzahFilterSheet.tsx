import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {ArrowLeft, CalendarDays} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {MonthPicker} from '@/components/ui/MonthPicker';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {colors} from '@/theme';
import type {LokasiAbsensi} from '../services/absensiAsatidzah.service';
import {bulanId, bulanKey, tanggalId} from '../format';

export type AbsensiAsatidzahFilter = {
  bulan: string; // YYYY-MM, dipakai bila tanggal kosong
  tanggal: string | null; // YYYY-MM-DD
  lokasiId: number | null;
  userId: number | null;
};

export const defaultAbsensiAsatidzahFilter = (): AbsensiAsatidzahFilter => ({
  bulan: bulanKey(),
  tanggal: null,
  lokasiId: null,
  userId: null,
});

type Props = {
  visible: boolean;
  value: AbsensiAsatidzahFilter;
  lokasi: LokasiAbsensi[];
  /** Pegawai yang dikenal dari data; null bila pengguna tidak boleh memfilter pegawai. */
  pegawai: {id: number; name: string}[] | null;
  onClose: () => void;
  onApply: (value: AbsensiAsatidzahFilter) => void;
};

export function AbsensiAsatidzahFilterSheet({
  visible,
  value,
  lokasi,
  pegawai,
  onClose,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [page, setPage] = useState<'main' | 'bulan' | 'tanggal'>('main');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setPage('main');
    }
  }, [visible, value]);

  const lokasiOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua lokasi'}].concat(
        lokasi.map(l => ({value: l.id, label: l.nama})),
      ),
    [lokasi],
  );
  const pegawaiOptions = useMemo(
    () =>
      [{value: null as number | null, label: 'Semua pegawai'}].concat(
        (pegawai ?? []).map(p => ({value: p.id, label: p.name})),
      ),
    [pegawai],
  );

  const title = page === 'main' ? 'Filter' : page === 'bulan' ? 'Pilih Bulan' : 'Pilih Tanggal';

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

      {page === 'bulan' ? (
        <View className="pb-2">
          <MonthPicker
            value={draft.bulan}
            onChange={bulan => {
              setDraft(d => ({...d, bulan, tanggal: null}));
              setPage('main');
            }}
          />
        </View>
      ) : page === 'tanggal' ? (
        <View className="pb-2">
          <CalendarPicker
            value={draft.tanggal}
            onChange={tanggal => {
              setDraft(d => ({...d, tanggal}));
              setPage('main');
            }}
          />
        </View>
      ) : (
        <>
          <View className="gap-4 pb-1">
            <PickerField
              icon={CalendarDays}
              label="Bulan"
              value={bulanId(draft.bulan)}
              placeholder="Pilih bulan"
              onPress={() => setPage('bulan')}
              onClear={() => setDraft(d => ({...d, bulan: bulanKey()}))}
            />
            <PickerField
              icon={CalendarDays}
              label="Tanggal"
              value={draft.tanggal ? tanggalId(draft.tanggal) : null}
              placeholder="Semua tanggal"
              onPress={() => setPage('tanggal')}
              onClear={() => setDraft(d => ({...d, tanggal: null}))}
            />
            <Select<number | null>
              label="Lokasi"
              placeholder="Semua lokasi"
              value={draft.lokasiId}
              onChange={lokasiId => setDraft(d => ({...d, lokasiId}))}
              options={lokasiOptions}
            />
            {pegawai ? (
              <Select<number | null>
                label="Pegawai"
                placeholder="Semua pegawai"
                value={draft.userId}
                onChange={userId => setDraft(d => ({...d, userId}))}
                options={pegawaiOptions}
              />
            ) : null}
          </View>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Reset"
                variant="outline"
                onPress={() => {
                  onApply(defaultAbsensiAsatidzahFilter());
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
