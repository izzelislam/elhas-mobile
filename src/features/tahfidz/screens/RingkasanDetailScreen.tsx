import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpenCheck} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {SetoranItem} from '../components/SetoranItem';
import {getSetoranList} from '../services/setoran.service';
import type {RingkasanSantri, Setoran} from '../types';

const PER_PAGE = 15;

const dateLong = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

/** `ringkasan` dari daftar ditampilkan langsung; riwayat setoran dimuat dari API per santri. */
export default function RingkasanDetailScreen({
  ringkasan,
  onBack,
}: {
  ringkasan: RingkasanSantri;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Setoran[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const page = useRef(1);
  const lastPage = useRef(1);
  const busy = useRef(false);

  const load = useCallback(
    async (target: number) => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      try {
        const res = await getSetoranList({
          santri_id: ringkasan.santri_id,
          per_page: PER_PAGE,
          page: target,
        });
        page.current = res.meta.current_page;
        lastPage.current = res.meta.last_page;
        setHasMore(res.meta.current_page < res.meta.last_page);
        setTotal(res.meta.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat riwayat setoran');
      } finally {
        busy.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [ringkasan.santri_id],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const more = () => {
    if (page.current < lastPage.current && !busy.current) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const nama = ringkasan.santri?.nama_lengkap ?? '-';

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="overflow-hidden bg-brand px-5 pb-5">
        <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <View className="mt-3 flex-row items-center">
          <Avatar name={nama} size={60} />
          <View className="ml-3 flex-1">
            <Text className="text-heading text-brand-foreground" numberOfLines={2}>
              {nama}
            </Text>
            {ringkasan.santri ? (
              <Text className="text-label text-brand-foreground opacity-80">
                NIS {ringkasan.santri.nis}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-card bg-white/15 px-3 py-2.5">
            <Text className="text-caption text-brand-foreground opacity-80">Jumlah setoran</Text>
            <Text className="text-title text-brand-foreground">{ringkasan.jumlah_setoran}</Text>
          </View>
          <View className="flex-1 rounded-card bg-white/15 px-3 py-2.5">
            <Text className="text-caption text-brand-foreground opacity-80">Setoran terakhir</Text>
            <Text className="text-label font-semibold text-brand-foreground">
              {ringkasan.terakhir_setoran ? dateLong(ringkasan.terakhir_setoran) : '-'}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Riwayat setoran tidak dapat dimuat
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
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => <SetoranItem item={item} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            total > 0 ? (
              <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
                RIWAYAT SETORAN · {total}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <BookOpenCheck size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada setoran</Text>
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
    </View>
  );
}
