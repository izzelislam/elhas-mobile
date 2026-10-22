import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, CircleCheck, CircleX, ClipboardCheck} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {RekapParams, getDetailSantri} from '../services/mutabaahSantri.service';
import type {DetailSantri, KegiatanMutabaah, RekapSantri} from '../types';

const OK = '#059669';
const NO = '#DC2626';

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const dateLong = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** `santri` dari rekap ditampilkan langsung; rincian per hari dimuat dari API. */
export default function MutabaahSantriDetailScreen({
  santri,
  params,
  onBack,
}: {
  santri: RekapSantri;
  params: Omit<RekapParams, 'santri_id'>;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DetailSantri | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getDetailSantri(santri.id, params));
      setFailed(false);
    } catch (err) {
      setFailed(true);
      const detail = describeError(err);
      toast.error(detail ? `Gagal memuat detail (${detail})` : 'Gagal memuat detail mutabaah');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [santri.id, params]);

  useEffect(() => {
    load();
  }, [load]);

  // kelompokkan per tanggal, terbaru di atas
  const days = useMemo(() => {
    const map = new Map<string, KegiatanMutabaah[]>();
    (data?.kegiatan ?? []).forEach(k => map.set(k.tanggal, [...(map.get(k.tanggal) ?? []), k]));
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [data]);

  const total = data?.kegiatan.length ?? 0;
  const done = data?.kegiatan.filter(k => k.dikerjakan).length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const periode = data?.periode;

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
          <Avatar name={santri.nama} size={60} />
          <View className="ml-3 flex-1">
            <Text className="text-heading text-brand-foreground" numberOfLines={2}>
              {santri.nama}
            </Text>
            <Text className="text-label text-brand-foreground opacity-80">
              NIS {santri.nomor_induk}
            </Text>
          </View>
        </View>
        {periode ? (
          <Text className="mt-3 text-label text-brand-foreground opacity-80">
            Periode {dateShort(periode.tanggal_mulai)} – {dateShort(periode.tanggal_selesai)}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail mutabaah tidak dapat dimuat
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
        <ScrollView
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }>
          <View className="flex-row gap-3">
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Dikerjakan</Text>
              <Text className="mt-1 text-heading" style={{color: OK}}>
                {done}
              </Text>
            </Card>
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Tidak dikerjakan</Text>
              <Text className="mt-1 text-heading" style={{color: NO}}>
                {total - done}
              </Text>
            </Card>
            <Card className="flex-1 border-0 p-4">
              <Text className="text-caption text-ink-muted">Capaian</Text>
              <Text className="mt-1 text-heading text-ink">{percent}%</Text>
            </Card>
          </View>

          {days.length === 0 ? (
            <View className="mt-10 items-center">
              <ClipboardCheck size={40} color={colors.text.muted} />
              <Text className="mt-3 text-body text-ink-muted">Belum ada data mutabaah</Text>
            </View>
          ) : (
            days.map(([tanggal, list]) => {
              const dayDone = list.filter(k => k.dikerjakan).length;
              return (
                <View key={tanggal} className="mt-5">
                  <View className="mb-2 ml-1 flex-row items-center justify-between">
                    <Text className="text-caption font-medium tracking-wide text-ink-muted">
                      {dateLong(tanggal).toUpperCase()}
                    </Text>
                    <Text className="text-caption font-medium text-ink-muted">
                      {dayDone}/{list.length}
                    </Text>
                  </View>
                  <Card className="border-0 px-4 py-1">
                    {list.map((k, i) => (
                      <View key={k.id}>
                        {i > 0 ? <View className="h-px bg-line" /> : null}
                        <View className="flex-row items-start py-3">
                          {k.dikerjakan ? (
                            <CircleCheck size={20} color={OK} />
                          ) : (
                            <CircleX size={20} color={NO} />
                          )}
                          <View className="ml-3 flex-1">
                            <Text className="text-label font-medium text-ink">
                              {k.indikator.nama}
                            </Text>
                            {k.catatan ? (
                              <Text className="mt-0.5 text-caption text-ink-muted">
                                {k.catatan}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    ))}
                  </Card>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
