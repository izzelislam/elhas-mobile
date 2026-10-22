import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  BedDouble,
  BookOpen,
  GraduationCap,
  MapPin,
  Phone,
  User,
  Users,
  Wallet,
} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {colors} from '@/theme';
import {toast} from '@/store/toast.store';
import {getSantriDetail} from '../services/santri.service';
import type {SantriDetail} from '../types';

const rupiah = (v: string) =>
  'Rp ' + Math.round(Number(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const dateId = (v: string | null) => {
  if (!v) {
    return null;
  }
  const d = new Date(v);
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
};

function Field({label, value}: {label: string; value?: string | number | null}) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <View className="py-2.5">
      <Text className="text-caption text-ink-muted">{label}</Text>
      <Text className="mt-0.5 text-body text-ink">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-line" />;
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-4 p-0">
      <View className="flex-row items-center border-b border-line px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
          <Icon size={16} color={colors.brand.DEFAULT} />
        </View>
        <Text className="ml-3 text-body font-semibold text-ink">{title}</Text>
      </View>
      <View className="px-4 py-1">{children}</View>
    </Card>
  );
}

function Stat({icon: Icon, label, value}: {icon: LucideIcon; label: string; value?: string | null}) {
  return (
    <Card className="flex-1 items-center px-2 py-3">
      <Icon size={18} color={colors.brand.DEFAULT} />
      <Text className="mt-1.5 text-caption text-ink-muted">{label}</Text>
      <Text className="mt-0.5 text-center text-label font-semibold text-ink" numberOfLines={2}>
        {value ?? '-'}
      </Text>
    </Card>
  );
}

export default function SantriDetailScreen({id, onBack}: {id: number; onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const [santri, setSantri] = useState<SantriDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSantri(await getSantriDetail(id));
    } catch {
      toast.error('Gagal memuat detail santri');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const s = santri;
  const ttl = s ? [s.tempat_lahir, dateId(s.tanggal_lahir)].filter(Boolean).join(', ') : '';
  const alamat = s ? [s.alamat, s.kota, s.provinsi, s.kode_pos].filter(Boolean).join(', ') : '';
  const kamar = s?.asrama_aktif
    ? `${s.asrama_aktif.nama_kamar} (${s.asrama_aktif.nomor_kamar})`
    : null;

  return (
    <View className="flex-1 bg-canvas">
      {loading ? (
        <>
          <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-6">
            <Pressable onPress={onBack} hitSlop={10} className="self-start">
              <ArrowLeft size={22} color={colors.brand.foreground} />
            </Pressable>
            <Text className="mt-3 text-title text-brand-foreground">Detail Santri</Text>
          </View>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.brand.DEFAULT} />
          </View>
        </>
      ) : !s ? (
        <>
          <View style={{paddingTop: insets.top + 24}} className="bg-brand px-5 pb-6">
            <Pressable onPress={onBack} hitSlop={10} className="self-start">
              <ArrowLeft size={22} color={colors.brand.foreground} />
            </Pressable>
            <Text className="mt-3 text-title text-brand-foreground">Detail Santri</Text>
          </View>
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-4 text-center text-body text-ink-muted">
              Detail santri tidak dapat dimuat
            </Text>
            <Button title="Coba lagi" onPress={load} />
          </View>
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{paddingBottom: insets.bottom + 24}}
          showsVerticalScrollIndicator={false}>
          <View
            style={{paddingTop: insets.top + 24}}
            className="items-center overflow-hidden bg-brand px-5 pb-16">
            <View className="absolute -right-12 -top-8 h-44 w-44 rounded-icon bg-white/10" />
            <View className="absolute -left-16 top-20 h-36 w-36 rounded-icon bg-white/10" />
            <Pressable onPress={onBack} hitSlop={10} className="self-start">
              <ArrowLeft size={22} color={colors.brand.foreground} />
            </Pressable>
            <View className="mt-1">
              <Avatar uri={s.foto ?? undefined} name={s.nama_lengkap} size={96} />
            </View>
            <Text className="mt-3 text-center text-heading text-brand-foreground">
              {s.nama_lengkap}
            </Text>
            {s.nama_panggilan ? (
              <Text className="text-label text-brand-foreground opacity-80">
                "{s.nama_panggilan}"
              </Text>
            ) : null}
            <View className="mt-3 flex-row gap-2">
              <View className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-caption font-medium text-brand-foreground">
                  NIS {s.nis}
                </Text>
              </View>
              <View className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-caption font-medium text-brand-foreground">
                  {s.status.label}
                </Text>
              </View>
            </View>
          </View>

          <View className="-mt-10 px-5">
            <View className="flex-row gap-3">
              <Stat icon={GraduationCap} label="Kelas" value={s.kelas_aktif?.nama} />
              <Stat icon={BookOpen} label="Halaqah" value={s.halaqah_aktif?.nama} />
              <Stat icon={BedDouble} label="Kamar" value={kamar} />
            </View>

            {s.tabungan ? (
              <Card className="mt-4 flex-row items-center bg-brand-light/60 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand">
                  <Wallet size={18} color={colors.brand.foreground} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-caption text-ink-muted">Saldo Tabungan</Text>
                  <Text className="text-title font-semibold text-ink">
                    {rupiah(s.tabungan.saldo)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-caption text-ink-muted">No. Rekening</Text>
                  <Text className="text-label font-medium text-ink">
                    {s.tabungan.no_rekening}
                  </Text>
                </View>
              </Card>
            ) : null}

            <Section title="Data Pribadi" icon={User}>
              <Field label="NISN" value={s.nisn} />
              <Divider />
              <Field label="Jenis Kelamin" value={s.jenis_kelamin.label} />
              <Divider />
              <Field label="Tempat, Tanggal Lahir" value={ttl ? `${ttl} (${s.umur} tahun)` : null} />
              <Divider />
              <Field label="Golongan Darah" value={s.golongan_darah} />
              <Divider />
              <Field
                label="Anak ke / Saudara"
                value={
                  s.anak_ke !== null || s.jumlah_saudara !== null
                    ? `Anak ke-${s.anak_ke ?? '-'} dari ${s.jumlah_saudara ?? '-'} bersaudara`
                    : null
                }
              />
              <Divider />
              <Field label="Kategori SPP" value={s.kategori_spp?.label} />
            </Section>

            <Section title="Alamat & Pendidikan" icon={MapPin}>
              <Field label="Alamat" value={alamat || null} />
              <Divider />
              <Field label="Gedung Asrama" value={s.asrama_aktif?.gedung.nama} />
              <Divider />
              <Field label="Asal Sekolah" value={s.asal_sekolah} />
              <Divider />
              <Field label="No. Ijazah" value={s.nomor_ijazah} />
              <Field label="Tanggal Masuk" value={dateId(s.tanggal_masuk)} />
              <Field label="Tanggal Keluar" value={dateId(s.tanggal_keluar)} />
            </Section>

            <Section title={`Prestasi (${s.prestasi.length})`} icon={Award}>
              {s.prestasi.length ? (
                s.prestasi.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="py-3">
                      <Text className="text-body font-medium text-ink">{p.judul}</Text>
                      <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                        {[p.peringkat, p.tingkat, p.kategori].map(t => (
                          <View key={t} className="rounded-full bg-brand-light px-2.5 py-0.5">
                            <Text className="text-caption capitalize text-brand">{t}</Text>
                          </View>
                        ))}
                      </View>
                      <Text className="mt-1.5 text-caption text-ink-muted">{dateId(p.tanggal)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada prestasi</Text>
              )}
            </Section>

            <Section title="Wali Santri" icon={Users}>
              {s.wali_santri.length ? (
                s.wali_santri.map((w, i) => (
                  <View key={w.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="flex-row items-center py-3">
                      <Avatar name={w.nama_lengkap} size={40} />
                      <View className="ml-3 flex-1">
                        <Text className="text-body font-medium text-ink">{w.nama_lengkap}</Text>
                        <Text className="text-caption text-ink-muted">
                          {w.hubungan.label}
                          {w.is_utama ? ' · Wali utama' : ''}
                        </Text>
                        {w.no_hp ? (
                          <Text className="text-caption text-ink-muted">{w.no_hp}</Text>
                        ) : null}
                      </View>
                      {w.no_hp ? (
                        <Pressable
                          hitSlop={10}
                          onPress={() => Linking.openURL(`tel:${w.no_hp}`)}
                          className="h-10 w-10 items-center justify-center rounded-full bg-brand">
                          <Phone size={16} color={colors.brand.foreground} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada data wali</Text>
              )}
            </Section>

            {s.catatan ? (
              <Card className="mt-4 p-4">
                <Text className="text-caption text-ink-muted">Catatan</Text>
                <Text className="mt-1 text-body text-ink">{s.catatan}</Text>
              </Card>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
