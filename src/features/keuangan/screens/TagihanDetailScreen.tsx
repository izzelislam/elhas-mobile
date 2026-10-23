import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Download, Maximize2, X} from 'lucide-react-native';
import {Button} from '@/components/ui/Button';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {dialog} from '@/store/dialog.store';
import {useAuthStore} from '@/store/auth.store';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {rupiah} from '../components/format';
import {statusColor, statusLabel} from '../components/tagihanStatus';
import {downloadKwitansi, getTagihanDetail, verifikasiPembayaran} from '../services/tagihan.service';
import type {Pembayaran, Tagihan, TagihanDetail} from '../types';


const dateFull = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

const dateTime = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const humanize = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

function Row({label, value}: {label: string; value: string | null | undefined}) {
  return (
    <View className="flex-row py-2">
      <Text className="w-32 text-label text-ink-muted">{label}</Text>
      <Text className="flex-1 text-label font-medium text-ink">{value || '-'}</Text>
    </View>
  );
}

export default function TagihanDetailScreen({
  tagihan,
  onBack,
  onBayar,
  onChanged,
}: {
  tagihan: Tagihan;
  onBack: () => void;
  onBayar: (t: Tagihan) => void;
  onChanged?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<TagihanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const isWali = useAuthStore(s => s.user?.roles.some(r => /wali/i.test(r)) ?? false);
  const [tolak, setTolak] = useState<Pembayaran | null>(null);
  const [alasan, setAlasan] = useState('');
  const [alasanError, setAlasanError] = useState('');
  const [acting, setActing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const name = await downloadKwitansi(tagihan.id);
      toast.success(`${name} tersimpan di folder Download`);
    } catch {
      toast.error('Gagal mengunduh kwitansi. Pastikan aplikasi sudah di-build ulang.');
    } finally {
      setDownloading(false);
    }
  };

  const done = (message: string) => {
    toast.success(message);
    load();
    onChanged?.();
  };

  const setuju = (p: Pembayaran) =>
    dialog.confirm({
      title: 'Setujui pembayaran?',
      message: `Pembayaran ${rupiah(p.nominal_bayar)} akan diverifikasi sebagai sukses.`,
      confirmText: 'Setujui',
      onConfirm: async () => {
        setActing(true);
        try {
          const res = await verifikasiPembayaran(p.id, {status: 'accept'});
          done(res.message || 'Pembayaran disetujui');
        } catch (err) {
          toast.error(describeError(err) || 'Gagal menyetujui pembayaran');
        } finally {
          setActing(false);
        }
      },
    });

  const submitTolak = async () => {
    if (!tolak) {
      return;
    }
    if (!alasan.trim()) {
      setAlasanError('Alasan penolakan wajib diisi');
      return;
    }
    setActing(true);
    try {
      const res = await verifikasiPembayaran(tolak.id, {
        status: 'reject',
        note: alasan.trim(),
      });
      setTolak(null);
      done(res.message || 'Pembayaran ditolak');
    } catch (err) {
      toast.error(describeError(err) || 'Gagal menolak pembayaran');
    } finally {
      setActing(false);
    }
  };
  const load = () => {
    setLoading(true);
    getTagihanDetail(tagihan.id)
      .then(d => {
        setData(d);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Gagal memuat detail tagihan');
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [tagihan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = data ?? tagihan;
  // sedang menunggu_konfirmasi atau sudah lunas: tidak perlu bayar lagi; ditolak kembali ke belum_bayar
  const canPay = ['belum_bayar', 'sebagian'].includes(t.status) && t.sisa_tagihan > 0;
  const c = statusColor(t.status);
  const progress = Number(t.nominal) > 0 ? Math.min(1, Number(t.nominal_terbayar) / Number(t.nominal)) : 0;

  return (
    <View className="flex-1 bg-canvas">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">{t.nama}</Text>
        <Text className="text-label text-brand-foreground opacity-80">
          {t.santri?.nama_lengkap} · NIS {t.santri?.nis}
        </Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">Detail tidak dapat dimuat</Text>
          <Button title="Coba lagi" onPress={load} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{padding: 20, paddingBottom: insets.bottom + 100}}
          showsVerticalScrollIndicator={false}>
          <Card className="mb-4 border-0 p-4">
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-caption text-ink-muted">Sisa tagihan</Text>
                <Text className="text-heading text-ink">{rupiah(t.sisa_tagihan)}</Text>
              </View>
              <View style={{backgroundColor: c + '1A'}} className="rounded-full px-3 py-1">
                <Text style={{color: c}} className="text-caption font-semibold">
                  {statusLabel(t.status)}
                </Text>
              </View>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-field">
              <View style={{width: `${progress * 100}%`, backgroundColor: c}} className="h-2" />
            </View>
            <Text className="mt-2 text-caption text-ink-muted">
              Terbayar {rupiah(t.nominal_terbayar)} dari {rupiah(t.nominal)}
            </Text>
            {Number(t.nominal_terbayar) > 0 ? (
              <Pressable
                onPress={download}
                disabled={downloading}
                className="mt-4 h-11 flex-row items-center justify-center rounded-card border border-brand active:opacity-70">
                {downloading ? (
                  <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
                ) : (
                  <Download size={18} color={colors.brand.DEFAULT} />
                )}
                <Text className="ml-2 text-label font-semibold text-brand">
                  {downloading ? 'Mengunduh…' : 'Unduh kwitansi'}
                </Text>
              </Pressable>
            ) : null}
          </Card>

          <Card className="mb-4 border-0 px-4 py-1">
            <Row label="Santri" value={t.santri ? `${t.santri.nama_lengkap} (${t.santri.nis})` : null} />
            <Row label="Kode" value={t.kode} />
            <Row label="Jenis" value={humanize(t.tipe)} />
            <Row label="Bulan" value={t.bulan ? MONTHS[t.bulan - 1] : null} />
            <Row label="Komponen biaya" value={t.komponen_biaya?.nama} />
            <Row label="Jatuh tempo" value={t.tanggal_jatuh_tempo ? dateFull(t.tanggal_jatuh_tempo) : null} />
            <Row label="Catatan" value={t.catatan} />
          </Card>

          <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
            RIWAYAT PEMBAYARAN · {data?.riwayat_pembayaran.length ?? 0}
          </Text>
          {data?.riwayat_pembayaran.length ? (
            <View className="gap-3">
              {data.riwayat_pembayaran.map(p => {
                const sc =
                  p.status === 'sukses' ? '#059669' : p.status === 'pending' ? '#D97706' : '#DC2626';
                return (
                  <Card key={p.id} className="border-0 p-4">
                    <View className="flex-row items-center">
                      <View className="flex-1">
                        <Text className="text-caption text-ink-muted">Nominal dibayar</Text>
                        <Text className="text-heading text-ink">{rupiah(p.nominal_bayar)}</Text>
                      </View>
                      <View style={{backgroundColor: sc + '1A'}} className="rounded-full px-3 py-1">
                        <Text style={{color: sc}} className="text-caption font-semibold">
                          {humanize(p.status)}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-2 border-t border-line pt-1">
                      <Row label="Tanggal" value={dateTime(p.tanggal_bayar)} />
                      <Row label="Metode" value={humanize(p.metode_pembayaran)} />
                      <Row label="No. referensi" value={p.reference_number} />
                      <Row label="Dicatat oleh" value={p.bendahara?.name} />
                    </View>

                    {p.alasan_penolakan ? (
                      <View className="mt-2 rounded-card bg-red-50 p-3">
                        <Text className="text-caption font-semibold text-destructive">
                          Alasan penolakan
                        </Text>
                        <Text className="mt-0.5 text-label text-ink">{p.alasan_penolakan}</Text>
                      </View>
                    ) : null}

                    {p.bukti_pembayaran_url ? (
                      <View className="mt-3">
                        <Text className="mb-1.5 text-label font-medium text-ink">
                          Bukti pembayaran
                        </Text>
                        <Pressable
                          onPress={() => setPreview(p.bukti_pembayaran_url)}
                          className="overflow-hidden rounded-card active:opacity-80">
                          <Image
                            source={{uri: p.bukti_pembayaran_url}}
                            className="h-48 w-full bg-field"
                            resizeMode="cover"
                          />
                          <View className="absolute bottom-2 right-2 flex-row items-center rounded-full bg-black/60 px-2.5 py-1">
                            <Maximize2 size={12} color="#fff" />
                            <Text className="ml-1 text-caption text-white">Perbesar</Text>
                          </View>
                        </Pressable>
                      </View>
                    ) : null}

                    {p.status === 'pending' && !isWali ? (
                      <View className="mt-4 flex-row gap-3">
                        <View className="flex-1">
                          <Button
                            title="Tolak"
                            variant="outline"
                            disabled={acting}
                            onPress={() => {
                              setAlasan('');
                              setAlasanError('');
                              setTolak(p);
                            }}
                          />
                        </View>
                        <View className="flex-1">
                          <Button title="Setujui" disabled={acting} onPress={() => setuju(p)} />
                        </View>
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          ) : (
            <Text className="ml-1 text-label text-ink-muted">Belum ada pembayaran</Text>
          )}
        </ScrollView>
      )}
      <BottomSheet visible={!!tolak} title="Tolak Pembayaran" onClose={() => setTolak(null)}>
        <Text className="mb-1.5 text-label font-medium text-ink">Alasan penolakan</Text>
        <TextInput
          value={alasan}
          onChangeText={v => {
            setAlasan(v);
            setAlasanError('');
          }}
          placeholder="Mis. Bukti transfer tidak jelas"
          placeholderTextColor={colors.text.muted}
          multiline
          textAlignVertical="top"
          className="min-h-[96px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
        />
        {alasanError ? (
          <Text className="mt-1 text-caption text-destructive">{alasanError}</Text>
        ) : null}
        <View className="mt-4">
          <Button title="Tolak pembayaran" loading={acting} onPress={submitTolak} />
        </View>
      </BottomSheet>
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable onPress={() => setPreview(null)} className="flex-1 items-center justify-center bg-black/90">
          {preview ? (
            <Image source={{uri: preview}} className="h-full w-full" resizeMode="contain" />
          ) : null}
          <View style={{top: insets.top + 16}} className="absolute right-5 h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <X size={20} color="#fff" />
          </View>
        </Pressable>
      </Modal>
      {!loading && !failed && canPay ? (
        <View style={{bottom: insets.bottom + 16}} className="absolute left-5 right-5">
          <Button title="Bayar tagihan" onPress={() => onBayar(t)} />
        </View>
      ) : null}
    </View>
  );
}
