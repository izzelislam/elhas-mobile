import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CalendarDays} from 'lucide-react-native';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {MonthPicker} from '@/components/ui/MonthPicker';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {bulanId, bulanKey, statusColor} from '../format';
import {AbsensiAsatidzah, getAbsensiAsatidzahList} from '../services/absensiAsatidzah.service';

type Hitung = Record<string, {label: string; jumlah: number}>;

function hitung(list: AbsensiAsatidzah[]) {
  const h: Hitung = {};
  list.forEach(a => {
    const k = a.status.value;
    h[k] = {label: a.status.label, jumlah: (h[k]?.jumlah ?? 0) + 1};
  });
  return h;
}

/**
 * Rekap bulanan dihitung dari daftar absensi (belum ada endpoint rekap):
 * ringkasan per status, dan per pegawai bila data memuat lebih dari satu orang.
 */
export default function AbsensiAsatidzahRekapScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [bulan, setBulan] = useState(bulanKey());
  const [sheet, setSheet] = useState(false);
  const [items, setItems] = useState<AbsensiAsatidzah[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAbsensiAsatidzahList({bulan})
      .then(res => {
        setItems(res);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Gagal memuat rekap absensi');
      })
      .finally(() => setLoading(false));
  }, [bulan]);

  useEffect(load, [load]);

  const total = useMemo(() => hitung(items), [items]);
  const perPegawai = useMemo(() => {
    const m = new Map<number, {name: string; list: AbsensiAsatidzah[]}>();
    items.forEach(a => {
      const e = m.get(a.user_id) ?? {name: a.user?.name ?? `#${a.user_id}`, list: []};
      e.list.push(a);
      m.set(a.user_id, e);
    });
    return Array.from(m.values()).map(e => ({name: e.name, jumlah: e.list.length, hitung: hitung(e.list)}));
  }, [items]);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Rekap Absensi</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10} className="active:opacity-70">
            <CalendarDays size={22} color={colors.brand.foreground} />
          </Pressable>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">{bulanId(bulan)}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">Rekap tidak dapat dimuat</Text>
          <Button title="Coba lagi" onPress={load} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}>
          <Card className="mb-3 border-0 p-4">
            <Text className="text-caption text-ink-muted">Total kehadiran tercatat</Text>
            <Text className="text-heading text-ink">{items.length}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {Object.entries(total).map(([k, v]) => (
                <View
                  key={k}
                  style={{backgroundColor: statusColor(k) + '1A'}}
                  className="rounded-full px-3 py-1.5">
                  <Text style={{color: statusColor(k)}} className="text-label font-semibold">
                    {v.label}: {v.jumlah}
                  </Text>
                </View>
              ))}
              {items.length === 0 ? (
                <Text className="text-label text-ink-muted">Belum ada data bulan ini</Text>
              ) : null}
            </View>
          </Card>

          {perPegawai.length > 1
            ? perPegawai.map(p => (
                <Card key={p.name} className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Text className="flex-1 text-body font-semibold text-ink" numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text className="text-label text-ink-muted">{p.jumlah} hari</Text>
                  </View>
                  <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(p.hitung).map(([k, v]) => (
                      <Text key={k} style={{color: statusColor(k)}} className="text-label font-medium">
                        {v.label} {v.jumlah}
                      </Text>
                    ))}
                  </View>
                </Card>
              ))
            : null}
        </ScrollView>
      )}

      <BottomSheet visible={sheet} title="Pilih Bulan" onClose={() => setSheet(false)}>
        <View className="pb-2">
          <MonthPicker
            value={bulan}
            onChange={b => {
              setBulan(b);
              setSheet(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
