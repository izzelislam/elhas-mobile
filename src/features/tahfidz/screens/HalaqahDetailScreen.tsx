import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpen, ChevronRight, Search, UserRound, Users, X} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getHalaqahDetail} from '../services/halaqah.service';
import {getRingkasan} from '../services/ringkasan.service';
import type {Halaqah, HalaqahDetail, RingkasanSantri} from '../types';

/** Anggota halaqah dari API detail; ringkasan setoran digabung agar santri yang belum setoran tetap tampil. */
export default function HalaqahDetailScreen({
  halaqah,
  onBack,
  onSelectSantri,
}: {
  halaqah: Halaqah;
  onBack: () => void;
  onSelectSantri: (ringkasan: RingkasanSantri) => void;
}) {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<HalaqahDetail | null>(null);
  const [ringkasan, setRingkasan] = useState<Map<number, RingkasanSantri>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([
        getHalaqahDetail(halaqah.id),
        // Ringkasan hanya pelengkap: bila gagal, daftar santri tetap ditampilkan.
        getRingkasan({halaqah_id: halaqah.id}).catch(() => null),
      ]);
      setDetail(d);
      setRingkasan(new Map((r?.per_santri ?? []).map(i => [i.santri_id, i])));
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat data halaqah');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [halaqah.id]);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (detail?.santri ?? []).filter(
        s => !query || s.nama_lengkap.toLowerCase().includes(query),
      ),
    [detail, query],
  );

  const open = (s: HalaqahDetail['santri'][number]) =>
    onSelectSantri(
      ringkasan.get(s.id) ?? {
        santri_id: s.id,
        jumlah_setoran: 0,
        terakhir_setoran: null,
        santri: s,
      },
    );

  const header = (
    <View
      style={{paddingTop: insets.top + 24}}
      className="overflow-hidden bg-brand px-5 pb-5">
      <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
      <Pressable onPress={onBack} hitSlop={10} className="self-start">
        <ArrowLeft size={22} color={colors.brand.foreground} />
      </Pressable>
      <View className="mt-3 flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
          <BookOpen size={26} color={colors.brand.foreground} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-heading text-brand-foreground" numberOfLines={1}>
            {halaqah.nama}
          </Text>
          <View className="mt-1 flex-row items-center">
            <UserRound size={13} color={colors.brand.foreground} />
            <Text className="ml-1.5 text-label text-brand-foreground opacity-80">
              {detail?.musyrif?.name ?? halaqah.musyrif?.name ?? '-'}
            </Text>
            <Users size={13} color={colors.brand.foreground} style={{marginLeft: 12}} />
            <Text className="ml-1.5 text-label text-brand-foreground opacity-80">
              {detail?.santri.length ?? halaqah.jumlah_santri} santri
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      {header}

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
            Data halaqah tidak dapat dimuat
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
          data={visible}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => {
            const r = ringkasan.get(item.id);
            return (
              <Pressable onPress={() => open(item)} className="active:opacity-80">
                <Card className="mb-3 flex-row items-center border-0 p-4">
                  <Avatar name={item.nama_lengkap} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="text-body font-semibold text-ink" numberOfLines={1}>
                      {item.nama_lengkap}
                    </Text>
                    <Text className="text-caption text-ink-muted">NIS {item.nis}</Text>
                  </View>
                  <Text
                    className={
                      r ? 'text-caption font-semibold text-brand' : 'text-caption text-ink-muted'
                    }>
                    {r ? `${r.jumlah_setoran} setoran` : 'Belum setoran'}
                  </Text>
                  <ChevronRight size={18} color={colors.text.muted} />
                </Card>
              </Pressable>
            );
          }}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListHeaderComponent={
            visible.length > 0 ? (
              <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
                ANGGOTA HALAQAH · {visible.length}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Users size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Santri tidak ditemukan' : 'Belum ada santri di halaqah ini'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
