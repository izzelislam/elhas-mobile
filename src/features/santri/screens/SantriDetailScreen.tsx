import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  BedDouble,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  Receipt,
  ShieldAlert,
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
import {KartuSantri} from '../components/KartuSantri';
import {surahName} from '@/features/tahfidz/surah';
import {getSantriDetail} from '../services/santri.service';
import type {SantriDetail} from '../types';

type Hafalan = SantriDetail['hafalan_setoran'][number];

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

const humanize = (v: string) =>
  v
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const dateShort = (v: string) =>
  new Date(v + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const OK = '#059669';
const WARN = '#D97706';
const BAD = '#DC2626';
const INFO = '#2563EB';
const NEUTRAL = '#6B7280';

const ABSEN_COLOR: Record<string, string> = {hadir: OK, izin: INFO, sakit: WARN, alpa: BAD};
const TAGIHAN_COLOR: Record<string, string> = {lunas: OK, sebagian: WARN, belum_bayar: BAD};
const KATEGORI_COLOR: Record<string, string> = {berat: BAD, sedang: WARN, ringan: NEUTRAL};
const KUALITAS_COLOR: Record<string, string> = {
  mumtaz: OK,
  jayyid_jiddan: INFO,
  jayyid: WARN,
  maqbul: '#EA580C',
};

const ayatRange = (h: Hafalan) => {
  const a = `${surahName(h.surah_mulai)} ${h.ayat_mulai}`;
  const b = `${surahName(h.surah_selesai)} ${h.ayat_selesai}`;
  return a === b ? a : `${a} – ${b}`;
};

function Chip({label, color}: {label: string; color: string}) {
  return (
    <View style={{backgroundColor: color + '1A'}} className="rounded-full px-2.5 py-0.5">
      <Text style={{color}} className="text-caption font-medium">
        {label}
      </Text>
    </View>
  );
}

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
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  badge?: string | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <Card className="mt-4 overflow-hidden p-0">
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        className={`flex-row items-center px-4 py-3 active:opacity-80 ${
          open ? 'border-b border-line' : ''
        }`}>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
          <Icon size={16} color={colors.brand.DEFAULT} />
        </View>
        <Text className="ml-3 flex-1 text-body font-semibold text-ink">{title}</Text>
        {badge ? <Text className="mr-2 text-caption text-ink-muted">{badge}</Text> : null}
        <Chevron size={18} color={colors.text.muted} />
      </Pressable>
      {open ? <View className="px-4 py-1">{children}</View> : null}
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
  const [allAbsensi, setAllAbsensi] = useState(false);

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
  const poin = s?.poin_santri[0];
  const absensiByDay = (() => {
    const map = new Map<string, NonNullable<typeof s>['absensi']>();
    (s?.absensi ?? []).forEach(a => map.set(a.tanggal, [...(map.get(a.tanggal) ?? []), a]));
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  })();
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

            <KartuSantri santri={s} />

            <Section title="Data Pribadi" icon={User} defaultOpen>
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

            <Section title="Alamat & Pendidikan" icon={MapPin} defaultOpen>
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

            <Section title="Riwayat Kelas" icon={GraduationCap}>
              {s.kelas_santri.length ? (
                s.kelas_santri.map((k, i) => (
                  <View key={k.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="flex-row items-center py-3">
                      <View className="flex-1 pr-3">
                        <Text className="text-label font-medium text-ink">{k.kelas.nama}</Text>
                        <Text className="text-caption text-ink-muted">
                          {[k.tahun_ajaran.nama, k.kelas.wali_kelas ? `Wali kelas ${k.kelas.wali_kelas.name}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <Chip
                        label={humanize(k.status)}
                        color={k.status === 'aktif' ? OK : NEUTRAL}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada riwayat kelas</Text>
              )}
            </Section>

            <Section title="Prestasi" badge={`${s.prestasi.length}`} icon={Award}>
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

            {s.tabungan ? (
              <Section title="Transaksi Tabungan" icon={Wallet}>
                {s.tabungan.transaksi_terakhir.length ? (
                  s.tabungan.transaksi_terakhir.map((t, i) => {
                    const masuk = t.tipe === 'masuk';
                    return (
                      <View key={t.id}>
                        {i > 0 ? <Divider /> : null}
                        <View className="flex-row items-center py-3">
                          <View className="flex-1 pr-3">
                            <Text className="text-label font-medium text-ink">
                              {t.keterangan ?? (masuk ? 'Setoran' : 'Penarikan')}
                            </Text>
                            <Text className="text-caption text-ink-muted">
                              {dateShort(t.tanggal_transaksi)} · {humanize(t.status)}
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
                  })
                ) : (
                  <Text className="py-3 text-label text-ink-muted">Belum ada transaksi</Text>
                )}
              </Section>
            ) : null}

            <Section
              title="Tagihan"
              badge={`${s.tagihan.filter(t => t.status !== 'lunas').length} belum lunas`}
              icon={Receipt}>
              {s.tagihan.length ? (
                s.tagihan.map((t, i) => (
                  <View key={t.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="py-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 pr-3 text-label font-medium text-ink">
                          {t.nama}
                        </Text>
                        <Chip
                          label={humanize(t.status)}
                          color={TAGIHAN_COLOR[t.status] ?? NEUTRAL}
                        />
                      </View>
                      <Text className="mt-1 text-caption text-ink-muted">
                        {rupiah(t.nominal_terbayar)} dari {rupiah(t.nominal)} · jatuh tempo{' '}
                        {dateShort(t.tanggal_jatuh_tempo)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada tagihan</Text>
              )}
            </Section>

            <Section title="Setoran Hafalan" badge={`${s.hafalan_setoran.length}`} icon={BookOpen}>
              {s.hafalan_setoran.length ? (
                s.hafalan_setoran.map((h, i) => (
                  <View key={h.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="py-3">
                      <Text className="text-caption text-ink-muted">{dateShort(h.tanggal)}</Text>
                      <Text className="mt-0.5 text-label font-medium text-ink">
                        {ayatRange(h)}
                      </Text>
                      {h.halaman_mulai != null ? (
                        <Text className="text-caption text-ink-muted">
                          Hal. {h.halaman_mulai}
                          {h.halaman_selesai != null && h.halaman_selesai !== h.halaman_mulai
                            ? `–${h.halaman_selesai}`
                            : ''}
                        </Text>
                      ) : null}
                      {h.catatan ? (
                        <Text className="mt-1 text-caption text-ink-muted">{h.catatan}</Text>
                      ) : null}
                      <View className="mt-2 flex-row flex-wrap items-center gap-2">
                        <Chip
                          label={humanize(h.jenis)}
                          color={h.jenis === 'murajaah' ? '#0891B2' : '#7C3AED'}
                        />
                        <Chip
                          label={humanize(h.kualitas)}
                          color={KUALITAS_COLOR[h.kualitas] ?? NEUTRAL}
                        />
                        {h.ustadz ? (
                          <Text className="ml-auto text-caption text-ink-muted" numberOfLines={1}>
                            {h.ustadz.name}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada setoran</Text>
              )}
            </Section>

            <Section title="Absensi" icon={CalendarCheck}>
              {absensiByDay.length ? (
                <>
                  {(allAbsensi ? absensiByDay : absensiByDay.slice(0, 5)).map(([tgl, list], i) => (
                    <View key={tgl}>
                      {i > 0 ? <Divider /> : null}
                      <View className="py-3">
                        <Text className="text-caption text-ink-muted">{dateShort(tgl)}</Text>
                        <View className="mt-1.5 flex-row flex-wrap gap-2">
                          {list.map(a => (
                            <Chip
                              key={a.id}
                              label={`${humanize(a.jenis)}: ${humanize(a.status)}`}
                              color={ABSEN_COLOR[a.status] ?? NEUTRAL}
                            />
                          ))}
                        </View>
                        {list
                          .filter(a => a.keterangan)
                          .map(a => (
                            <Text key={a.id} className="mt-1 text-caption text-ink-muted">
                              {humanize(a.jenis)}: {a.keterangan}
                            </Text>
                          ))}
                      </View>
                    </View>
                  ))}
                  {absensiByDay.length > 5 ? (
                    <Pressable
                      onPress={() => setAllAbsensi(v => !v)}
                      className="items-center border-t border-line py-3 active:opacity-70">
                      <Text className="text-label font-medium text-brand">
                        {allAbsensi ? 'Tampilkan lebih sedikit' : `Lihat semua (${absensiByDay.length} hari)`}
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <Text className="py-3 text-label text-ink-muted">Belum ada absensi</Text>
              )}
            </Section>

            <Section title="Pelanggaran" badge={`${s.pelanggaran.length}`} icon={ShieldAlert}>
              {poin ? (
                <View className="flex-row items-baseline justify-between py-3">
                  <Text className="text-caption text-ink-muted">Sisa poin</Text>
                  <Text
                    style={{color: poin.poin_sisa <= 0 ? BAD : poin.poin_sisa < 50 ? WARN : OK}}
                    className="text-label font-semibold">
                    {poin.poin_sisa} / {poin.poin_awal}
                  </Text>
                </View>
              ) : null}
              {poin && s.pelanggaran.length ? <Divider /> : null}
              {s.pelanggaran.length ? (
                s.pelanggaran.map((p, i) => (
                  <View key={p.id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="py-3">
                      <Text className="text-label font-medium text-ink">
                        {p.jenis_pelanggaran.nama}
                      </Text>
                      <Text className="text-caption text-ink-muted">
                        {dateShort(p.tanggal)} · {p.poin} poin
                      </Text>
                      {p.catatan ? (
                        <Text className="mt-1 text-caption text-ink-muted">{p.catatan}</Text>
                      ) : null}
                      <View className="mt-2 flex-row gap-2">
                        <Chip
                          label={humanize(p.jenis_pelanggaran.kategori)}
                          color={KATEGORI_COLOR[p.jenis_pelanggaran.kategori] ?? NEUTRAL}
                        />
                        <Chip label={humanize(p.status)} color={NEUTRAL} />
                      </View>
                    </View>
                  </View>
                ))
              ) : poin ? null : (
                <Text className="py-3 text-label text-ink-muted">Tidak ada pelanggaran</Text>
              )}
            </Section>

            <Section title="Wali Santri" badge={`${s.wali_santri.length}`} icon={Users}>
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
                        {[w.pekerjaan, w.no_hp, w.email].filter(Boolean).map(t => (
                          <Text key={t} className="text-caption text-ink-muted">
                            {t}
                          </Text>
                        ))}
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
