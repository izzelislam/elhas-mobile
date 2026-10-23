import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {isAxiosError} from 'axios';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, DoorOpen, Plus, Search, SlidersHorizontal, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {useAuthStore} from '@/store/auth.store';
import {dialog} from '@/store/dialog.store';
import {toast} from '@/store/toast.store';
import {
  EMPTY_IZIN_FILTER,
  IzinFilter,
  IzinFilterSheet,
} from '../components/IzinFilterSheet';
import {approveIzin, getIzinList, kembaliIzin, rejectIzin} from '../services/izin.service';
import type {Izin} from '../types';

const PER_PAGE = 15;

const STATUS: Record<string, string> = {
  menunggu: '#D97706',
  disetujui: '#059669',
  ditolak: '#DC2626',
  selesai: '#6B7280',
};
const statusColor = (v: string) => STATUS[v] ?? colors.brand.DEFAULT;

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
const timeShort = (v: string) =>
  new Date(v).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace('.', ':');

function IzinItem({
  item,
  canAct,
  busy,
  onApprove,
  onReject,
  onKembali,
}: {
  item: Izin;
  canAct: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onKembali: () => void;
}) {
  const c = statusColor(item.status.value);
  return (
    <Card className="mb-3 border-0 p-4">
      <View className="flex-row items-center">
        <Avatar name={item.santri?.nama_lengkap} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-body font-semibold text-ink" numberOfLines={1}>
            {item.santri?.nama_lengkap ?? '-'}
          </Text>
          <Text className="text-caption text-ink-muted">NIS {item.santri?.nis ?? '-'}</Text>
        </View>
        <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
          <Text style={{color: c}} className="text-caption font-semibold">
            {item.status.value === 'menunggu' ? 'Menunggu' : item.status.label}
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-label text-ink">{item.keperluan}</Text>
      <View className="mt-3 flex-row items-center border-t border-line pt-3">
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Keluar</Text>
          <Text className="text-label font-medium text-ink">
            {dateShort(item.tanggal_keluar)}, {timeShort(item.tanggal_keluar)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-caption text-ink-muted">Kembali</Text>
          <Text className="text-label font-medium text-ink">
            {dateShort(item.tanggal_kembali_rencana)}, {timeShort(item.tanggal_kembali_rencana)}
          </Text>
        </View>
      </View>
      {item.tanggal_kembali_aktual ? (
        <Text className="mt-3 text-caption text-ink-muted">
          Kembali pada {dateShort(item.tanggal_kembali_aktual)},{' '}
          {timeShort(item.tanggal_kembali_aktual)}
        </Text>
      ) : null}
      {item.alasan_penolakan ? (
        <Text className="mt-3 text-caption text-destructive">{item.alasan_penolakan}</Text>
      ) : null}
      {canAct && item.status.value === 'menunggu' ? (
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button title="Tolak" variant="outline" disabled={busy} onPress={onReject} />
          </View>
          <View className="flex-1">
            <Button title="Setujui" loading={busy} disabled={busy} onPress={onApprove} />
          </View>
        </View>
      ) : null}
      {canAct && item.status.value === 'disetujui' && !item.tanggal_kembali_aktual ? (
        <View className="mt-3">
          <Button
            title="Tandai sudah kembali"
            variant="outline"
            loading={busy}
            disabled={busy}
            onPress={onKembali}
          />
        </View>
      ) : null}
    </Card>
  );
}

export default function IzinScreen({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Izin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);
  const [filter, setFilter] = useState<IzinFilter>(EMPTY_IZIN_FILTER);
  const [sheet, setSheet] = useState(false);
  const canAct = useAuthStore(s => !!s.user?.permissions.includes('izin.approve'));
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Izin | null>(null);
  const [alasan, setAlasan] = useState('');

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getIzinList({
          per_page: PER_PAGE,
          page: target,
          santri_id: filter.santri?.id,
          status: filter.status ?? undefined,
          tanggal: filter.tanggal ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.meta.current_page;
        lastPage.current = res.meta.last_page;
        setHasMore(res.meta.current_page < res.meta.last_page);
        setTotal(res.meta.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat data izin');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load]);

  const errorMessage = (err: unknown, fallback: string) =>
    isAxiosError(err)
      ? err.response?.data?.message ?? (err.response ? fallback : 'Tidak dapat terhubung ke server')
      : fallback;

  const approve = (item: Izin) =>
    dialog.confirm({
      title: 'Setujui izin?',
      message: `Izin keluar ${item.santri?.nama_lengkap ?? 'santri'} akan disetujui.`,
      confirmText: 'Setujui',
      onConfirm: async () => {
        setActingId(item.id);
        try {
          const res = await approveIzin(item.id);
          toast.success(res.message || 'Izin disetujui');
          load(1);
        } catch (err) {
          toast.error(errorMessage(err, 'Gagal menyetujui izin'));
        } finally {
          setActingId(null);
        }
      },
    });

  const kembali = (item: Izin) =>
    dialog.confirm({
      title: 'Santri sudah kembali?',
      message: `${item.santri?.nama_lengkap ?? 'Santri'} akan ditandai sudah kembali ke pesantren.`,
      confirmText: 'Sudah kembali',
      onConfirm: async () => {
        setActingId(item.id);
        try {
          const res = await kembaliIzin(item.id);
          toast.success(res.message || 'Santri ditandai sudah kembali');
          load(1);
        } catch (err) {
          toast.error(errorMessage(err, 'Gagal menandai kembali'));
        } finally {
          setActingId(null);
        }
      },
    });

  const reject = async () => {
    if (!rejectTarget) {
      return;
    }
    const target = rejectTarget;
    setActingId(target.id);
    setRejectTarget(null);
    try {
      const res = await rejectIzin(target.id, alasan.trim() || undefined);
      toast.success(res.message || 'Izin ditolak');
      load(1);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal menolak izin'));
    } finally {
      setActingId(null);
      setAlasan('');
    }
  };

  const activeCount =
    (filter.santri ? 1 : 0) + (filter.status ? 1 : 0) + (filter.tanggal ? 1 : 0);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query ? items.filter(i => i.santri?.nama_lengkap.toLowerCase().includes(query)) : items,
    [items, query],
  );

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  // API belum punya parameter pencarian: saat mencari, muat sisa halaman agar hasilnya lengkap
  useEffect(() => {
    if (query && !loading && !loadingMore) {
      more();
    }
  }, [query, items, loading, loadingMore]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Izin</Text>
          <Pressable onPress={() => setSheet(true)} hitSlop={10}>
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-icon border border-brand bg-destructive" />
            ) : null}
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} izin keluar{activeCount > 0 ? ' (terfilter)' : ' tercatat'}
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 py-3">
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
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Data izin tidak dapat dimuat
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
          data={visible}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => (
            <IzinItem
              item={item}
              canAct={canAct}
              busy={actingId === item.id}
              onApprove={() => approve(item)}
              onKembali={() => kembali(item)}
              onReject={() => {
                setAlasan('');
                setRejectTarget(item);
              }}
            />
          )}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 96}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <DoorOpen size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada izin keluar'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : hasMore ? (
              <Pressable onPress={more} className="items-center py-4 active:opacity-70">
                <Text className="text-label font-medium text-brand">Muat lebih banyak</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
      <BottomSheet
        visible={!!rejectTarget}
        title="Tolak izin"
        onClose={() => setRejectTarget(null)}>
        <Text className="mb-2 text-label text-ink-muted">
          {rejectTarget?.santri?.nama_lengkap} · {rejectTarget?.keperluan}
        </Text>
        <TextInput
          value={alasan}
          onChangeText={setAlasan}
          placeholder="Alasan penolakan (opsional)"
          placeholderTextColor={colors.text.muted}
          multiline
          textAlignVertical="top"
          className="min-h-[96px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
        />
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button title="Batal" variant="outline" onPress={() => setRejectTarget(null)} />
          </View>
          <View className="flex-1">
            <Button title="Tolak izin" onPress={reject} />
          </View>
        </View>
      </BottomSheet>
      <IzinFilterSheet
        visible={sheet}
        value={filter}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
      <Pressable
        onPress={onCreate}
        style={{bottom: insets.bottom + 20}}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        accessibilityLabel="Ajukan izin">
        <Plus size={26} color={colors.brand.foreground} />
      </Pressable>
    </View>
  );
}
