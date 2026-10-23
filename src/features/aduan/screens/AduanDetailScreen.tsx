import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Pencil, Trash2} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {describeError} from '@/lib/errors';
import {dialog} from '@/store/dialog.store';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {Aduan, deleteAduan, getAduanDetail, updateAduan} from '../services/aduan.service';
import {useAduanAccess} from '../access';
import {aduanColor, aduanLabel} from '../status';

const dateTime = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AduanDetailScreen({
  aduan,
  onBack,
  onSaved,
  onEdit,
}: {
  aduan: Aduan;
  onBack: () => void;
  onSaved: () => void; // setelah status diperbarui, kembali ke daftar
  onEdit: (a: Aduan) => void;
}) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Aduan>(aduan);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const {isWali, canRespond} = useAduanAccess();
  const [nextStatus, setNextStatus] = useState<'diproses' | 'selesai'>('diproses');
  const [tanggapan, setTanggapan] = useState('');
  const [saving, setSaving] = useState(false);

  const hapus = () =>
    dialog.confirm({
      title: 'Hapus aduan?',
      message: `Aduan "${aduan.judul}" akan dihapus dan tidak dapat dikembalikan.`,
      confirmText: 'Hapus',
      onConfirm: async () => {
        try {
          const res = await deleteAduan(aduan.id);
          toast.success(res.message || 'Aduan dihapus');
          onSaved();
        } catch (err) {
          toast.error(describeError(err) || 'Gagal menghapus aduan');
        }
      },
    });

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateAduan(aduan.id, {
        status: nextStatus,
        ...(tanggapan.trim() ? {tanggapan: tanggapan.trim()} : {}),
      });
      toast.success(res.message || 'Aduan diperbarui');
      onSaved();
    } catch (err) {
      toast.error(describeError(err) || 'Gagal memperbarui aduan');
    } finally {
      setSaving(false);
    }
  };

  const load = () =>
    getAduanDetail(aduan.id)
      .then(d => {
        setData(d);
        if (d.status === 'diproses' || d.status === 'selesai') {
          setNextStatus(d.status);
        }
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Gagal memuat detail aduan');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

  useEffect(() => {
    load();
  }, [aduan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = aduanColor(data.status);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior="padding">
      <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-5">
        <Pressable onPress={onBack} hitSlop={10} className="self-start">
          <ArrowLeft size={22} color={colors.brand.foreground} />
        </Pressable>
        <Text className="mt-3 text-heading text-brand-foreground">Detail Aduan</Text>
        <Text className="text-label text-brand-foreground opacity-80">Aduan #{data.id}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand.DEFAULT} />
        </View>
      ) : failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-body text-ink-muted">
            Detail aduan tidak dapat dimuat
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
          <Card className="mb-4 border-0 p-4">
            <View className="flex-row items-center">
              <Avatar name={data.santri?.nama_lengkap} size={44} />
              <View className="ml-3 flex-1">
                <Text className="text-body font-semibold text-ink" numberOfLines={1}>
                  {data.santri?.nama_lengkap ?? '-'}
                </Text>
                <Text className="text-caption text-ink-muted">NIS {data.santri?.nis ?? '-'}</Text>
              </View>
              <View style={{backgroundColor: c + '1A'}} className="ml-2 rounded-full px-3 py-1">
                <Text style={{color: c}} className="text-caption font-semibold">
                  {aduanLabel(data.status)}
                </Text>
              </View>
            </View>
            <View className="mt-4 border-t border-line pt-4">
              <Text className="text-heading text-ink">{data.judul}</Text>
              <Text className="mt-1 text-caption text-ink-muted">
                {[dateTime(data.created_at), data.wali ? `Oleh ${data.wali.name}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text className="mt-3 text-body text-ink">{data.isi}</Text>
            </View>
          </Card>

          {(isWali || __DEV__) && data.status === 'menunggu' ? (
            <View className="mb-4 flex-row gap-3">
              <Pressable
                onPress={() => onEdit(data)}
                className="h-12 flex-1 flex-row items-center justify-center rounded-card bg-brand active:opacity-80">
                <Pencil size={18} color={colors.brand.foreground} />
                <Text className="ml-2 text-label font-semibold text-brand-foreground">Ubah</Text>
              </Pressable>
              <Pressable
                onPress={hapus}
                className="h-12 flex-1 flex-row items-center justify-center rounded-card bg-red-50 active:opacity-80">
                <Trash2 size={18} color="#DC2626" />
                <Text className="ml-2 text-label font-semibold" style={{color: '#DC2626'}}>
                  Hapus
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text className="mb-2 ml-1 text-caption font-medium tracking-wide text-ink-muted">
            TANGGAPAN
          </Text>
          {data.tanggapan ? (
            <Card className="border-0 p-4">
              <Text className="text-body text-ink">{data.tanggapan}</Text>
              <Text className="mt-3 text-caption text-ink-muted">
                {[
                  data.penanggap ? `Oleh ${data.penanggap.name}` : null,
                  data.ditanggapi_pada ? dateTime(data.ditanggapi_pada) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </Card>
          ) : (
            <Text className="ml-1 text-label text-ink-muted">Belum ada tanggapan</Text>
          )}

          {canRespond ? (
            <>
              <Text className="mb-2 ml-1 mt-5 text-caption font-medium tracking-wide text-ink-muted">
                TINDAK LANJUT
              </Text>
              <Card className="border-0 p-4">
                <Text className="mb-1.5 text-label font-medium text-ink">Ubah status</Text>
                <View className="flex-row gap-2">
                  {(
                    [
                      {key: 'diproses', label: 'Diproses'},
                      {key: 'selesai', label: 'Selesai'},
                    ] as {key: 'diproses' | 'selesai'; label: string}[]
                  ).map(o => {
                    const active = nextStatus === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => setNextStatus(o.key)}
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
                <Text className="mb-1.5 mt-4 text-label font-medium text-ink">Tanggapan</Text>
                <TextInput
                  value={tanggapan}
                  onChangeText={setTanggapan}
                  placeholder="Tulis tanggapan untuk wali (opsional)"
                  placeholderTextColor={colors.text.muted}
                  multiline
                  textAlignVertical="top"
                  className="min-h-[96px] rounded-card border border-line bg-field px-4 py-3 text-body text-ink"
                />
                <View className="mt-4">
                  <Button title="Simpan" loading={saving} onPress={save} />
                </View>
              </Card>
            </>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
