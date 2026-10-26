import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Bell, CheckCheck, SlidersHorizontal} from 'lucide-react-native';
import {ActiveFilterChips, FilterChip} from '@/components/ui/ActiveFilterChips';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {
  NotifikasiFilter,
  NotifikasiFilterSheet,
  categoryLabel,
  defaultNotifikasiFilter,
} from '../components/NotifikasiFilterSheet';
import {
  Notifikasi,
  getNotifikasiList,
  markAllRead,
  markRead,
} from '../services/notifikasi.service';

const PER_PAGE = 20;
const BASE_CATEGORIES = ['informasi', 'akun'];

export default function NotifikasiScreen({
  onBack,
  onOpenRoute,
}: {
  onBack: () => void;
  /** Dipanggil dengan `data.route` notifikasi saat diketuk. */
  onOpenRoute?: (route: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notifikasi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<NotifikasiFilter>(defaultNotifikasiFilter);
  const [sheet, setSheet] = useState(false);
  const [categories, setCategories] = useState<string[]>(BASE_CATEGORIES);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getNotifikasiList({
          page: target,
          per_page: PER_PAGE,
          category: filter.category ?? undefined,
          read: filter.read ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.current_page;
        lastPage.current = res.last_page;
        setTotal(res.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setCategories(prev => {
          const next = new Set(prev);
          res.data.forEach(n => next.add(n.category));
          return next.size === prev.length ? prev : Array.from(next);
        });
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat notifikasi');
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

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  const unread = items.some(n => !n.is_read);

  const readAll = async () => {
    try {
      await markAllRead();
      toast.success('Semua notifikasi ditandai sudah dibaca');
      setLoading(true);
      load(1);
    } catch {
      toast.error('Gagal menandai notifikasi');
    }
  };

  const open = async (n: Notifikasi) => {
    if (!n.is_read) {
      setItems(prev => prev.map(i => (i.id === n.id ? {...i, is_read: true} : i)));
      markRead(n.id).catch(() => {
        setItems(prev => prev.map(i => (i.id === n.id ? {...i, is_read: false} : i)));
      });
    }
    if (n.data?.route) {
      onOpenRoute?.(n.data.route);
    }
  };

  const chips: FilterChip[] = [];
  if (filter.category) {
    chips.push({
      key: 'category',
      label: categoryLabel(filter.category),
      onRemove: () => setFilter(f => ({...f, category: null})),
    });
  }
  if (filter.read !== null) {
    chips.push({
      key: 'read',
      label: filter.read ? 'Sudah dibaca' : 'Belum dibaca',
      onRemove: () => setFilter(f => ({...f, read: null})),
    });
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 flex-1 text-title text-brand-foreground">Notifikasi</Text>
          <Pressable onPress={readAll} hitSlop={10} disabled={!unread} className="mr-4 active:opacity-70">
            <CheckCheck size={22} color={colors.brand.foreground} style={{opacity: unread ? 1 : 0.4}} />
          </Pressable>
          <Pressable onPress={() => setSheet(true)} hitSlop={10} className="active:opacity-70">
            <SlidersHorizontal size={22} color={colors.brand.foreground} />
          </Pressable>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} notifikasi
          </Text>
        ) : null}
      </View>

      <ActiveFilterChips chips={chips} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Notifikasi tidak dapat dimuat
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
          keyExtractor={n => String(n.id)}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(1);
          }}
          onEndReached={more}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              <Bell size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada notifikasi</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => (
            <Pressable onPress={() => open(item)} className="active:opacity-80">
              <Card className="mb-3 border-0 p-4">
                <View className="flex-row items-center">
                  <View className="rounded-full bg-brand-light px-2.5 py-1">
                    <Text className="text-caption font-semibold text-brand">
                      {categoryLabel(item.category)}
                    </Text>
                  </View>
                  <Text className="ml-2 flex-1 text-caption text-ink-muted">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {!item.is_read ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  ) : null}
                </View>
                <Text
                  className={`mt-3 text-body text-ink ${item.is_read ? 'font-medium' : 'font-semibold'}`}
                  numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="mt-1 text-label text-ink-muted" numberOfLines={3}>
                  {item.body}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}

      <NotifikasiFilterSheet
        visible={sheet}
        value={filter}
        categories={categories}
        onClose={() => setSheet(false)}
        onApply={setFilter}
      />
    </View>
  );
}
