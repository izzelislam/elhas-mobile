import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, MessageSquareWarning, Plus} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import AduanFormScreen from './AduanFormScreen';
import {Aduan, getAduanList} from '../services/aduan.service';
import {useAduanAccess} from '../access';
import {aduanColor, aduanLabel} from '../status';
import AduanDetailScreen from './AduanDetailScreen';

const PER_PAGE = 15;

// Tombol buat aduan untuk wali; sementara tampil juga di mode debug (__DEV__) untuk pengujian.
const SHOW_CREATE_FOR_ALL = __DEV__;

const STATUS: {key: string | null; label: string}[] = [
  {key: null, label: 'Semua'},
  {key: 'menunggu', label: 'Menunggu'},
  {key: 'diproses', label: 'Diproses'},
  {key: 'selesai', label: 'Selesai'},
];

export default function AduanScreen({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Aduan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const {isWali} = useAduanAccess();
  const [form, setForm] = useState(false);
  const [selected, setSelected] = useState<Aduan | null>(null);
  const [editing, setEditing] = useState<Aduan | null>(null);
  const [version, setVersion] = useState(0);
  const page = useRef(1);
  const lastPage = useRef(1);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: number) => {
    const id = ++requestId.current;
    try {
      const res = await getAduanList({
        page: target,
        per_page: PER_PAGE,
        status: status ?? undefined,
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
      toast.error('Gagal memuat aduan');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  },
    [status],
  );

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [load, version]);

  const more = () => {
    if (page.current < lastPage.current && !loadingMore && !loading) {
      setLoadingMore(true);
      load(page.current + 1);
    }
  };

  if (editing) {
    return (
      <AduanFormScreen
        aduan={editing}
        onBack={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setSelected(null);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (selected) {
    return (
      <AduanDetailScreen
        aduan={selected}
        onBack={() => setSelected(null)}
        onEdit={setEditing}
        onSaved={() => {
          setSelected(null);
          setVersion(v => v + 1);
        }}
      />
    );
  }
  if (form) {
    return (
      <AduanFormScreen
        onBack={() => setForm(false)}
        onSaved={() => {
          setForm(false);
          setVersion(v => v + 1);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Aduan</Text>
        </View>
        {total > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {total} aduan
          </Text>
        ) : null}
      </View>

      <View className="flex-row gap-2 bg-surface px-5 py-3">
        {STATUS.map(o => {
          const active = status === o.key;
          return (
            <Pressable
              key={o.label}
              onPress={() => setStatus(o.key)}
              className={`h-10 items-center justify-center rounded-full px-4 ${
                active ? 'bg-brand' : 'bg-field'
              }`}>
              <Text
                className={`text-label font-medium ${
                  active ? 'text-brand-foreground' : 'text-ink-muted'
                }`}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Aduan tidak dapat dimuat
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
          keyExtractor={a => String(a.id)}
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
              <MessageSquareWarning size={44} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {status ? `Tidak ada aduan ${status}` : 'Belum ada aduan'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="py-4" color={colors.brand.DEFAULT} />
            ) : undefined
          }
          renderItem={({item}) => {
            const c = aduanColor(item.status);
            return (
              <Pressable onPress={() => setSelected(item)} className="active:opacity-80">
                <Card className="mb-3 border-0 p-4">
                  <View className="flex-row items-center">
                    <Avatar name={item.santri?.nama_lengkap} size={40} />
                    <View className="ml-3 flex-1">
                      <Text className="text-label font-semibold text-ink" numberOfLines={1}>
                        {item.santri?.nama_lengkap ?? '-'}
                      </Text>
                      <Text className="text-caption text-ink-muted">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-2.5 py-1">
                      <Text style={{color: c}} className="text-caption font-semibold">
                        {aduanLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-body font-semibold text-ink" numberOfLines={1}>
                    {item.judul}
                  </Text>
                  <Text className="mt-1 text-label text-ink-muted" numberOfLines={2}>
                    {item.isi}
                  </Text>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      {isWali || SHOW_CREATE_FOR_ALL ? (
        <Pressable
          onPress={() => setForm(true)}
          style={{bottom: insets.bottom + 20}}
          className="absolute right-5 h-14 flex-row items-center rounded-full bg-brand px-5 shadow-lg active:opacity-80">
          <Plus size={20} color={colors.brand.foreground} />
          <Text className="ml-2 text-label font-semibold text-brand-foreground">Buat aduan</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
