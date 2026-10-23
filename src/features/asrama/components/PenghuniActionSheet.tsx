import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {ArrowLeft, ArrowRightLeft, CalendarDays, ChevronRight, LogOut} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {Select} from '@/components/ui/Select';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {getKamar, keluarkanPenghuni, pindahPenghuni} from '../services/asrama.service';
import type {Kamar, Penghuni} from '../types';

type Page = 'menu' | 'pindah' | 'keluar' | 'tanggal';

const dateId = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

type Props = {
  penghuni: Penghuni | null;
  kamar: Kamar; // kamar asal
  onClose: () => void;
  onDone: () => void;
};

/** Aksi per penghuni: pindah ke kamar lain atau keluar dari asrama. */
export function PenghuniActionSheet({penghuni, kamar, onClose, onDone}: Props) {
  const [page, setPage] = useState<Page>('menu');
  const [from, setFrom] = useState<'pindah' | 'keluar'>('pindah');
  const [tujuan, setTujuan] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(todayKey());
  const [catatan, setCatatan] = useState('');
  const [kamarList, setKamarList] = useState<Kamar[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (penghuni) {
      setPage('menu');
      setTujuan(null);
      setTanggal(todayKey());
      setCatatan('');
    }
  }, [penghuni]);

  useEffect(() => {
    if (page === 'pindah' && !kamarList) {
      getKamar()
        .then(setKamarList)
        .catch(() => toast.error('Gagal memuat daftar kamar'));
    }
  }, [page, kamarList]);

  // hanya kamar lain dengan jenis yang sama dan masih ada tempat
  const options = useMemo(
    () =>
      (kamarList ?? [])
        .filter(
          k =>
            k.id !== kamar.id &&
            k.jenis_kelamin === kamar.jenis_kelamin &&
            (k.penghuni_asrama_count ?? 0) < k.kapasitas,
        )
        .map(k => ({
          value: k.id as number | null,
          label: `${k.nomor_kamar} · ${k.nama_kamar} (${k.penghuni_asrama_count ?? 0}/${k.kapasitas})`,
        })),
    [kamarList, kamar],
  );

  const nama = penghuni?.santri?.nama_lengkap ?? 'santri';
  const note = catatan.trim() || null;

  const submit = async () => {
    if (!penghuni) {
      return;
    }
    if (page === 'pindah' && tujuan === null) {
      toast.error('Pilih kamar tujuan');
      return;
    }
    setSaving(true);
    try {
      const res =
        page === 'pindah'
          ? await pindahPenghuni(penghuni.id, {
              kamar_asrama_id: tujuan as number,
              tanggal_pindah: tanggal,
              catatan: note,
            })
          : await keluarkanPenghuni(penghuni.id, {tanggal_keluar: tanggal, catatan: note});
      toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(describeError(err) || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const back = (
    <Pressable
      onPress={() => setPage(page === 'tanggal' ? from : 'menu')}
      hitSlop={10}
      className="mb-3 flex-row items-center self-start">
      <ArrowLeft size={16} color={colors.brand.DEFAULT} />
      <Text className="ml-1 text-label font-medium text-brand">Kembali</Text>
    </Pressable>
  );

  const openTanggal = (p: 'pindah' | 'keluar') => {
    setFrom(p);
    setPage('tanggal');
  };

  const form = (p: 'pindah' | 'keluar') => (
    <>
      {back}
      <View className="gap-4 pb-1">
        {p === 'pindah' ? (
          <Select
            label="Kamar tujuan"
            placeholder={kamarList ? 'Pilih kamar' : 'Memuat kamar…'}
            value={tujuan}
            options={options}
            onChange={setTujuan}
          />
        ) : null}
        <PickerField
          icon={CalendarDays}
          label={p === 'pindah' ? 'Tanggal pindah' : 'Tanggal keluar'}
          value={dateId(tanggal)}
          placeholder="Pilih tanggal"
          onPress={() => openTanggal(p)}
          onClear={() => setTanggal(todayKey())}
        />
        <View>
          <Text className="mb-1.5 text-label font-medium text-ink">Catatan (opsional)</Text>
          <TextInput
            value={catatan}
            onChangeText={setCatatan}
            placeholder="Catatan"
            placeholderTextColor={colors.text.muted}
            className="h-12 rounded-card border border-line bg-field px-4 text-body text-ink"
          />
        </View>
      </View>
      <View className="mt-5">
        <Button
          title={p === 'pindah' ? 'Pindahkan' : 'Keluarkan dari asrama'}
          loading={saving}
          onPress={submit}
        />
      </View>
    </>
  );

  return (
    <BottomSheet
      visible={penghuni !== null}
      title={
        page === 'menu'
          ? nama
          : page === 'pindah'
          ? 'Pindah Kamar'
          : page === 'keluar'
          ? 'Keluar Asrama'
          : 'Pilih Tanggal'
      }
      onClose={onClose}>
      {page === 'menu' ? (
        <View className="pb-2">
          <Pressable
            onPress={() => setPage('pindah')}
            className="flex-row items-center border-b border-line py-3.5 active:opacity-70">
            <ArrowRightLeft size={20} color={colors.brand.DEFAULT} />
            <Text className="ml-3 flex-1 text-body text-ink">Pindah kamar</Text>
            <ChevronRight size={18} color={colors.text.muted} />
          </Pressable>
          <Pressable
            onPress={() => setPage('keluar')}
            className="flex-row items-center py-3.5 active:opacity-70">
            <LogOut size={20} color="#DC2626" />
            <Text className="ml-3 flex-1 text-body text-ink">Keluar dari asrama</Text>
            <ChevronRight size={18} color={colors.text.muted} />
          </Pressable>
        </View>
      ) : page === 'tanggal' ? (
        <>
          {back}
          <View className="pb-2">
            <CalendarPicker
              value={tanggal}
              onChange={t => {
                setTanggal(t);
                setPage(from);
              }}
            />
          </View>
        </>
      ) : (
        form(page)
      )}
    </BottomSheet>
  );
}
