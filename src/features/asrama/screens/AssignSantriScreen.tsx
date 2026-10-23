import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CalendarDays, Check, Search, Users, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {CalendarPicker} from '@/components/ui/CalendarPicker';
import {PickerField} from '@/components/ui/PickerField';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {genderLabel} from '../components/CapacityBar';
import {getSantriBelumBerkamar, masukkanSantri} from '../services/asrama.service';
import type {KamarDetail, SantriRingkas} from '../types';

const PER_PAGE = 15;

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

/** Pilih beberapa santri yang belum berkamar lalu masukkan ke `kamar`; sisa kapasitas membatasi pilihan. */
export default function AssignSantriScreen({
  kamar,
  onBack,
  onSaved,
}: {
  kamar: KamarDetail;
  onBack: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const sisa = Math.max(0, kamar.kapasitas - kamar.penghuni_asrama.length);
  const [items, setItems] = useState<SantriRingkas[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [tanggal, setTanggal] = useState(todayKey());
  const [sheet, setSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getSantriBelumBerkamar({
          page: target,
          per_page: PER_PAGE,
          search: query || undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.current_page;
        lastPage.current = res.last_page;
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat santri');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [query],
  );

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load]);

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const toggle = (s: SantriRingkas) => {
    if (selected.includes(s.id)) {
      setSelected(prev => prev.filter(x => x !== s.id));
    } else if (selected.length >= sisa) {
      toast.error(`Sisa kapasitas kamar ${sisa} santri`);
    } else {
      setSelected(prev => [...prev, s.id]);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await masukkanSantri({
        santri_ids: selected,
        kamar_asrama_id: kamar.id,
        tanggal_masuk: tanggal,
      });
      toast.success(res.message || 'Santri berhasil dimasukkan ke kamar');
      onSaved();
    } catch (err) {
      toast.error(describeError(err) || 'Gagal memasukkan santri');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Masukkan Santri</Text>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          {kamar.nomor_kamar} · {kamar.nama_kamar} · sisa {sisa} tempat
        </Text>
      </View>

      <View className="gap-3 bg-surface px-5 py-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama santri"
            returnKeyType="search"
            className="ml-2 h-11 flex-1 text-body text-ink"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <X size={18} color={colors.brand.DEFAULT} />
            </Pressable>
          ) : null}
        </View>
        <PickerField
          icon={CalendarDays}
          label="Tanggal masuk"
          value={dateId(tanggal)}
          placeholder="Pilih tanggal"
          onPress={() => setSheet(true)}
          onClear={() => setTanggal(todayKey())}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Daftar santri tidak dapat dimuat
          </Text>
          <Button
            title="Coba lagi"
            onPress={() => {
              setLoading(true);
              load(1);
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={s => String(s.id)}
          extraData={selected}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 100}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Users size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Semua santri sudah berkamar'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => {
            const on = selected.includes(item.id);
            return (
              <Pressable
                onPress={() => toggle(item)}
                className={`mb-2 flex-row items-center rounded-card border bg-surface p-3 active:opacity-80 ${
                  on ? 'border-brand' : 'border-line'
                }`}>
                <Avatar name={item.nama_lengkap} size={40} />
                <View className="ml-3 flex-1">
                  <Text className="text-label font-medium text-ink" numberOfLines={1}>
                    {item.nama_lengkap}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    NIS {item.nis} · {genderLabel(item.jenis_kelamin)}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    on ? 'border-brand bg-brand' : 'border-line'
                  }`}>
                  {on ? <Check size={14} color={colors.brand.foreground} /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {!loading && !failed ? (
        <View
          style={{bottom: insets.bottom + 16}}
          className="absolute left-5 right-5 rounded-card shadow-lg">
          <Button
            title={selected.length ? `Masukkan ${selected.length} santri` : 'Pilih santri'}
            disabled={selected.length === 0}
            loading={saving}
            onPress={submit}
          />
        </View>
      ) : null}

      <BottomSheet visible={sheet} title="Tanggal Masuk" onClose={() => setSheet(false)}>
        <View className="pb-2">
          <CalendarPicker
            value={tanggal}
            onChange={t => {
              setTanggal(t);
              setSheet(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
