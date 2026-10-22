import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, BookOpen, Search, UserRound, Users, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getHalaqahList} from '../services/halaqah.service';
import type {Halaqah} from '../types';

function HalaqahItem({item, onPress}: {item: Halaqah; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
    <Card className="mb-3 flex-row items-center border-0 p-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
        <BookOpen size={22} color={colors.brand.DEFAULT} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-body font-semibold text-ink" numberOfLines={1}>
          {item.nama}
        </Text>
        {item.musyrif ? (
          <View className="mt-1 flex-row items-center">
            <UserRound size={13} color={colors.text.muted} />
            <Text className="ml-1.5 flex-1 text-caption text-ink-muted" numberOfLines={1}>
              {item.musyrif.name}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="ml-2 flex-row items-center rounded-full bg-brand-light px-2.5 py-1">
        <Users size={13} color={colors.brand.DEFAULT} />
        <Text className="ml-1 text-caption font-semibold text-brand">{item.jumlah_santri}</Text>
      </View>
    </Card>
    </Pressable>
  );
}

export default function HalaqahScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (item: Halaqah) => void;
}) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Halaqah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await getHalaqahList());
      setFailed(false);
    } catch {
      setFailed(true);
      toast.error('Gagal memuat data halaqah');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query
        ? items.filter(
            i =>
              i.nama.toLowerCase().includes(query) ||
              i.musyrif?.name.toLowerCase().includes(query),
          )
        : items,
    [items, query],
  );
  const totalSantri = items.reduce((sum, i) => sum + i.jumlah_santri, 0);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">Halaqah</Text>
        </View>
        {items.length > 0 ? (
          <Text className="ml-9 mt-1 text-label text-brand-foreground opacity-80">
            {items.length} halaqah · {totalSantri} santri
          </Text>
        ) : null}
      </View>

      <View className="bg-surface px-5 py-3">
        <View className="flex-row items-center rounded-card bg-field px-3">
          <Search size={18} color={colors.brand.DEFAULT} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari halaqah atau musyrif"
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
          renderItem={({item}) => <HalaqahItem item={item} onPress={() => onSelect(item)} />}
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 20}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <BookOpen size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">
                {query ? 'Halaqah tidak ditemukan' : 'Belum ada halaqah'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
