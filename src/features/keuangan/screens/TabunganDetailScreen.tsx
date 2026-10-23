import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ReceiptText} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {getTabunganDetail} from '../services/tabungan.service';
import type {Tabungan, TabunganDetail} from '../types';

const OK = '#059669';
const BAD = '#DC2626';

const dateFull = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

const dateShort = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

const dateTime = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const humanize = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

function Row({label, value}: {label: string; value: string | null | undefined}) {
  return (
    <View className="flex-row py-2">
      <Text className="w-32 text-label text-ink-muted">{label}</Text>
      <Text className="flex-1 text-label font-medium text-ink">{value || '-'}</Text>
    </View>
  );
}

const statusLabel = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');

export default function TabunganDetailScreen({
  tabungan,
  onBack,
  onTransaksi,
  onRiwayat,
}: {
  tabungan: Tabungan;
  onBack: () => void;
  onTransaksi: (t: TabunganDetail) => void;
  onRiwayat: (tipe: 'semua' | 'keluar') => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<TabunganDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getTabunganDetail(tabungan.id));
      setFailed(false);
    } catch (err) {
      setFailed(true);
      const detail = describeError(err);
      toast.error(detail ? `Gagal memuat tabungan (${detail})` : 'Gagal memuat detail tabungan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tabungan.id]);

  useEffect(() => {
    load();
  }, [load]);

  const transaksi = useMemo(
    () =>
      [...(data?.transaksi ?? [])].sort((a, b) =>
        b.tanggal_transaksi.localeCompare(a.tanggal_transaksi),
      ),
    [data],
  );
  const saldo = data?.saldo ?? tabungan.saldo;
  const stat = useMemo(() => {
    const list = data?.transaksi ?? [];
    const sum = (tipe: string) =>
      list.filter(t => t.tipe === tipe && t.status === 'disetujui').reduce((a, t) => a + Number(t.nominal), 0);
    return {masuk: sum('masuk'), keluar: sum('keluar'), jumlah: list.length};
  }, [data]);

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="overflow-hidden bg-brand px-5 pb-5">
        <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <View className="mt-3 flex-row items-center">
          <Avatar name={tabungan.santri?.nama_lengkap} size={56} />
          <View className="ml-3 flex-1">
            <Text className="text-heading text-brand-foreground" numberOfLines={2}>
              {tabungan.santri?.nama_lengkap ?? '-'}
            </Text>
            <Text className="text-label text-brand-foreground opacity-80">
              {[tabungan.santri ? `NIS ${tabungan.santri.nis}` : null, tabungan.no_rekening]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
        <Text className="mt-4 text-caption text-brand-foreground opacity-80">Saldo</Text>
        <Text className="text-heading text-brand-foreground">{rupiah(saldo)}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail tabungan tidak dapat dimuat
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
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + (data.can_transact ? 100 : 24),
            }}
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
            <View className="mb-4 flex-row gap-3">
              <Card className="flex-1 border-0 p-3">
                <Text className="text-caption text-ink-muted">Total setoran</Text>
                <Text style={{color: OK}} className="text-label font-semibold">
                  {rupiah(stat.masuk)}
                </Text>
              </Card>
              <Card className="flex-1 border-0 p-3">
                <Text className="text-caption text-ink-muted">Total penarikan</Text>
                <Text style={{color: BAD}} className="text-label font-semibold">
                  {rupiah(stat.keluar)}
                </Text>
              </Card>
              <Card className="border-0 p-3">
                <Text className="text-caption text-ink-muted">Transaksi</Text>
                <Text className="text-label font-semibold text-ink">{stat.jumlah}</Text>
              </Card>
            </View>

            <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
              INFO REKENING
            </Text>
            <Card className="mb-4 border-0 px-4 py-1">
              <Row label="No. rekening" value={data.no_rekening} />
              <Row label="Saldo" value={rupiah(data.saldo)} />
              <Row label="Dibuka" value={dateFull(data.created_at)} />
              <Row label="Terakhir diperbarui" value={dateTime(data.updated_at)} />
            </Card>

            <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
              INFO SANTRI
            </Text>
            <Card className="mb-4 border-0 px-4 py-1">
              <Row label="Nama" value={data.santri?.nama_lengkap} />
              <Row label="Panggilan" value={data.santri?.nama_panggilan} />
              <Row label="NIS / NISN" value={[data.santri?.nis, data.santri?.nisn].filter(Boolean).join(' / ')} />
              <Row
                label="Jenis kelamin"
                value={data.santri?.jenis_kelamin ? (data.santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan') : null}
              />
              <Row
                label="Tempat, tgl lahir"
                value={[data.santri?.tempat_lahir, data.santri?.tanggal_lahir ? dateFull(data.santri.tanggal_lahir) : null]
                  .filter(Boolean)
                  .join(', ')}
              />
              <Row label="Status" value={data.santri ? humanize(data.santri.status) : null} />
              <Row label="Kategori SPP" value={data.santri?.kategori_spp ? humanize(data.santri.kategori_spp) : null} />
            </Card>

            <View className="mb-4 flex-row gap-3">
              <View className="flex-1">
                <Button title="Semua riwayat" variant="outline" onPress={() => onRiwayat('semua')} />
              </View>
              <View className="flex-1">
                <Button title="Riwayat penarikan" variant="outline" onPress={() => onRiwayat('keluar')} />
              </View>
            </View>
            <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
              RIWAYAT TRANSAKSI · {transaksi.length}
            </Text>
            {transaksi.length === 0 ? (
              <View className="mt-6 items-center">
                <ReceiptText size={40} color={colors.text.muted} />
                <Text className="mt-3 text-body text-ink-muted">Belum ada transaksi</Text>
              </View>
            ) : (
              <Card className="border-0 px-4 py-1">
                {transaksi.map((t, i) => {
                  const masuk = t.tipe === 'masuk';
                  return (
                    <View key={t.id}>
                      {i > 0 ? <View className="h-px bg-line" /> : null}
                      <View className="flex-row items-center py-3">
                        <View className="flex-1 pr-3">
                          <Text className="text-label font-medium text-ink">
                            {t.keterangan ?? (masuk ? 'Setoran' : 'Penarikan')}
                          </Text>
                          <Text className="text-caption text-ink-muted">
                            {[dateShort(t.tanggal_transaksi), statusLabel(t.status), t.bendahara?.name]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                        <Text
                          style={{color: masuk ? OK : BAD}}
                          className="text-label font-semibold">
                          {masuk ? '+' : '-'}
                          {rupiah(t.nominal)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </ScrollView>
          {data.can_transact ? (
            <View
              style={{bottom: insets.bottom + 16}}
              className="absolute left-5 right-5 rounded-card shadow-lg">
              <Button title="Transaksi baru" onPress={() => onTransaksi(data)} />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
