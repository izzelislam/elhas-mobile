import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Info} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {
  Informasi,
  KategoriInformasi,
  getInformasiList,
  getKategoriInformasi,
} from '../services/informasi.service';
import {InformasiImage} from '../components/InformasiImage';
import InformasiDetailScreen from './InformasiDetailScreen';

const PER_PAGE = 15;

export function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function InformasiScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Informasi[]>([]);
  const [kategori, setKategori] = useState<KategoriInformasi[]>([]);
  const [kategoriId, setKategoriId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Informasi | null>(null);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  useEffect(() => {
    getKategoriInformasi()
      .then(list => setKategori(list.filter(k => k.is_active)))
      .catch(() => toast.error('Gagal memuat kategori'));
  }, []);

  const load = useCallback(
    async (target: number) => {
      const id = ++requestId.current;
      try {
        const res = await getInformasiList({
          page: target,
          per_page: PER_PAGE,
          kategori_informasi_id: kategoriId ?? undefined,
        });
        if (id !== requestId.current) {
          return;
        }
        page.current = res.current_page;
        lastPage.current = res.last_page;
        setTotal(res.total);
        setItems(prev => (target === 1 ? res.data : [...prev, ...res.data]));
        setFailed(false);
      } catch {
        if (id !== requestId.current) {
          return;
        }
        if (target === 1) {
          setFailed(true);
        }
        toast.error('Gagal memuat informasi');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [kategoriId],
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

  if (selected) {
    return (
      <InformasiDetailScreen
        informasi={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  const chips: {id: number | null; label: string}[] = [
    {id: null, label: 'Semua'},
    ...kategori.map(k => ({id: k.id, label: k.nama_kategori})),
  ];

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-5"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Informasi
          </Text>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} informasi
          </Text>
        ) : null}
      </View>

      <View className="bg-surface">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {chips.map(o => {
            const active = kategoriId === o.id;
            return (
              <Pressable
                key={o.label}
                onPress={() => setKategoriId(o.id)}
                className={`h-10 items-center justify-center rounded-full px-4 ${
                  active ? 'bg-brand' : 'bg-field'
                }`}
              >
                <Text
                  className={`text-label font-medium ${
                    active ? 'text-brand-foreground' : 'text-ink-muted'
                  }`}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Informasi tidak dapat dimuat
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
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
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
              <Info size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                Belum ada informasi
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                className="py-4"
                color={colors.brand.DEFAULT}
              />
            ) : undefined
          }
          renderItem={({item}) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="active:opacity-80"
            >
              <Card className="mb-3 overflow-hidden border-0 p-0">
                <InformasiImage
                  uri={item.gambar ?? item.thumbnail}
                  className="h-36 w-full"
                />
                <View className="p-4">
                  <View className="flex-row items-center">
                    <View className="rounded-full bg-field px-2.5 py-1">
                      <Text className="text-caption font-semibold text-ink-muted">
                        {item.kategori?.nama_kategori ?? '-'}
                      </Text>
                    </View>
                    <Text className="ml-3 text-caption text-ink-muted">
                      {formatTanggal(item.tanggal_publish ?? item.created_at)}
                    </Text>
                  </View>
                  <Text
                    className="mt-3 text-body font-semibold text-ink"
                    numberOfLines={2}
                  >
                    {item.judul}
                  </Text>
                  <Text
                    className="mt-1 text-label text-ink-muted"
                    numberOfLines={2}
                  >
                    {item.ringkasan ?? item.isi}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
