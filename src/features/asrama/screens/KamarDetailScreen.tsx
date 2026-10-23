import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, EllipsisVertical, Users} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {CapacityBar, genderLabel} from '../components/CapacityBar';
import {PenghuniActionSheet} from '../components/PenghuniActionSheet';
import {getKamarDetail} from '../services/asrama.service';
import type {Kamar, KamarDetail, Penghuni} from '../types';

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

export default function KamarDetailScreen({
  kamar,
  onBack,
  onAssign,
  onChanged,
}: {
  kamar: Kamar;
  onBack: () => void;
  onAssign: (k: KamarDetail) => void;
  onChanged: () => void; // penghuni pindah atau keluar: induk memuat ulang daftar
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<KamarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [action, setAction] = useState<Penghuni | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getKamarDetail(kamar.id));
      setFailed(false);
    } catch (err) {
      setFailed(true);
      const detail = describeError(err);
      toast.error(detail ? `Gagal memuat kamar (${detail})` : 'Gagal memuat detail kamar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kamar.id]);

  useEffect(() => {
    load();
  }, [load]);

  const aktif = data?.penghuni_asrama.filter(p => p.status === 'aktif') ?? [];
  const penuh = data ? aktif.length >= data.kapasitas : false;

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="overflow-hidden bg-brand px-5 pb-5">
        <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">
          {kamar.nomor_kamar} · {kamar.nama_kamar}
        </Text>
        <Text className="text-label text-brand-foreground opacity-80">
          {[kamar.gedung_asrama?.nama, `Lantai ${kamar.lantai}`, genderLabel(kamar.jenis_kelamin)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail kamar tidak dapat dimuat
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
        <>
          <ScrollView
            contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 100}}
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
            <Card className="border-0 p-4">
              <CapacityBar count={aktif.length} cap={data.kapasitas} label="Penghuni aktif" />
              {data.keterangan ? (
                <Text className="mt-3 text-label text-ink-muted">{data.keterangan}</Text>
              ) : null}
            </Card>

            <Text className="mb-2 ml-1 mt-5 text-caption font-medium tracking-wide text-ink-muted">
              PENGHUNI · {aktif.length} SANTRI
            </Text>
            {aktif.length === 0 ? (
              <View className="mt-6 items-center">
                <Users size={40} color={colors.text.muted} />
                <Text className="mt-3 text-body text-ink-muted">Kamar masih kosong</Text>
              </View>
            ) : (
              <Card className="border-0 px-4 py-1">
                {aktif.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 ? <View className="h-px bg-line" /> : null}
                    <View className="flex-row items-center py-3">
                      <Avatar name={p.santri?.nama_lengkap} size={40} />
                      <View className="ml-3 flex-1">
                        <Text className="text-label font-medium text-ink" numberOfLines={1}>
                          {p.santri?.nama_lengkap ?? '-'}
                        </Text>
                        <Text className="text-caption text-ink-muted">
                          {[p.santri ? `NIS ${p.santri.nis}` : null, `Masuk ${dateShort(p.tanggal_masuk)}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setAction(p)}
                        hitSlop={10}
                        accessibilityLabel="Aksi penghuni">
                        <EllipsisVertical size={20} color={colors.text.muted} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </ScrollView>

          <View
            style={{bottom: insets.bottom + 16}}
            className="absolute left-5 right-5 rounded-card shadow-lg">
            <Button
              title={penuh ? 'Kamar penuh' : 'Masukkan santri'}
              disabled={penuh}
              onPress={() => onAssign({...data, penghuni_asrama: aktif})}
            />
          </View>
        </>
      )}
      <PenghuniActionSheet
        penghuni={action}
        kamar={kamar}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null);
          onChanged();
        }}
      />
    </View>
  );
}
