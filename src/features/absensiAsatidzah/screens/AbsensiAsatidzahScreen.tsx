import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Clock, SlidersHorizontal} from 'lucide-react-native';
import {ActiveFilterChips, FilterChip} from '@/components/ui/ActiveFilterChips';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {useAbsensiAsatidzahAccess} from '../access';
import {
  AbsensiAsatidzahFilter,
  AbsensiAsatidzahFilterSheet,
  defaultAbsensiAsatidzahFilter,
} from '../components/AbsensiAsatidzahFilterSheet';
import {bulanId, bulanKey, statusColor, tanggalId} from '../format';
import {
  AbsensiAsatidzah,
  LokasiAbsensi,
  getAbsensiAsatidzahList,
  getLokasiAbsensi,
} from '../services/absensiAsatidzah.service';
import AbsensiAsatidzahDetailScreen from './AbsensiAsatidzahDetailScreen';

export default function AbsensiAsatidzahScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const {canViewAll} = useAbsensiAsatidzahAccess();
  const [items, setItems] = useState<AbsensiAsatidzah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<AbsensiAsatidzahFilter>(defaultAbsensiAsatidzahFilter);
  const [sheet, setSheet] = useState(false);
  const [lokasi, setLokasi] = useState<LokasiAbsensi[]>([]);
  const [pegawai, setPegawai] = useState<{id: number; name: string}[]>([]);
  const [selected, setSelected] = useState<AbsensiAsatidzah | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    getLokasiAbsensi()
      .then(setLokasi)
      .catch(() => {}); // filter lokasi kosong bila gagal; filter lain tetap berfungsi
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const res = await getAbsensiAsatidzahList({
        bulan: filter.tanggal ? undefined : filter.bulan,
        tanggal: filter.tanggal ?? undefined,
        lokasi_id: filter.lokasiId ?? undefined,
        user_id: canViewAll ? filter.userId ?? undefined : undefined,
      });
      if (id !== requestId.current) {
        return;
      }
      setItems(res);
      setPegawai(prev => {
        const map = new Map(prev.map(p => [p.id, p]));
        res.forEach(a => a.user && map.set(a.user.id, {id: a.user.id, name: a.user.name}));
        return map.size === prev.length ? prev : Array.from(map.values());
      });
      setFailed(false);
    } catch {
      if (id !== requestId.current) {
        return;
      }
      setFailed(true);
      toast.error('Gagal memuat absensi');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filter, canViewAll]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const chips: FilterChip[] = useMemo(() => {
    const c: FilterChip[] = [];
    if (filter.tanggal) {
      c.push({
        key: 'tanggal',
        label: tanggalId(filter.tanggal),
        onRemove: () => setFilter(f => ({...f, tanggal: null})),
      });
    } else if (filter.bulan !== bulanKey()) {
      c.push({
        key: 'bulan',
        label: bulanId(filter.bulan),
        onRemove: () => setFilter(f => ({...f, bulan: bulanKey()})),
      });
    }
    if (filter.lokasiId) {
      c.push({
        key: 'lokasi',
        label: lokasi.find(l => l.id === filter.lokasiId)?.nama ?? 'Lokasi',
        onRemove: () => setFilter(f => ({...f, lokasiId: null})),
      });
    }
    if (filter.userId) {
      c.push({
        key: 'user',
        label: pegawai.find(p => p.id === filter.userId)?.name ?? 'Pegawai',
        onRemove: () => setFilter(f => ({...f, userId: null})),
      });
    }
    return c;
  }, [filter, lokasi, pegawai]);

  if (selected) {
    return <AbsensiAsatidzahDetailScreen absensi={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Daftar Absensi</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10} className="active:opacity-70">
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
          </Pressable>
        </View>
        <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
          {filter.tanggal ? tanggalId(filter.tanggal) : bulanId(filter.bulan)} · {items.length} data
        </Text>
      </View>

      <ActiveFilterChips chips={chips} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Absensi tidak dapat dimuat
          </Text>
          <Button
            title="Coba lagi"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              <Clock size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada data absensi</Text>
            </View>
          }
          renderItem={({item}) => {
            const c = statusColor(item.status.value);
            return (
              <Pressable onPress={() => setSelected(item)} className="active:opacity-80">
                <Card className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Avatar name={item.user?.name} size={40} />
                    <View className="ml-3 flex-1">
                      <Text className="text-label font-semibold text-ink" numberOfLines={1}>
                        {item.user?.name ?? '-'}
                      </Text>
                      <Text className="text-caption text-ink-muted">{tanggalId(item.tanggal)}</Text>
                    </View>
                    <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
                      <Text style={{color: c}} className="text-caption font-semibold">
                        {item.status.label}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row">
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Masuk</Text>
                      <Text className="text-body font-semibold text-ink">{item.jam_masuk ?? '-'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Pulang</Text>
                      <Text className="text-body font-semibold text-ink">{item.jam_pulang ?? '-'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-caption text-ink-muted">Lokasi</Text>
                      <Text className="text-label text-ink" numberOfLines={1}>
                        {item.lokasi?.nama ?? '-'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      <AbsensiAsatidzahFilterSheet
        visible={sheet}
        value={filter}
        lokasi={lokasi}
        pegawai={canViewAll ? pegawai : null}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
