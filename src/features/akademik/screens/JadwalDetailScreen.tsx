import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Users,
} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {toast} from '@/store/toast.store';
import {colors} from '@/theme';
import {hariLabel} from '../components/JadwalFilterSheet';
import {
  JadwalDetail,
  JadwalPelajaran,
  getJadwalDetail,
} from '../services/jadwal.service';

const hhmm = (v: string) => v.slice(0, 5);

function durasi(mulai: string, selesai: string) {
  const [h1, m1] = mulai.split(':').map(Number);
  const [h2, m2] = selesai.split(':').map(Number);
  const min = h2 * 60 + m2 - (h1 * 60 + m1);
  if (min <= 0) {
    return '-';
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} jam` : '', m ? `${m} menit` : ''].filter(Boolean).join(' ');
}

function Row({label, value}: {label: string; value?: string | null}) {
  return (
    <View className="flex-row items-start justify-between py-2">
      <Text className="text-label text-ink-muted">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-label font-medium text-ink">
        {value || '-'}
      </Text>
    </View>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-3 border-0 p-4">
      <View className="mb-1 flex-row items-center">
        <Icon size={18} color={colors.brand.DEFAULT} />
        <Text className="ml-2 text-body font-semibold text-ink">{title}</Text>
      </View>
      {children}
    </Card>
  );
}

export default function JadwalDetailScreen({
  jadwal,
  onBack,
}: {
  jadwal: JadwalPelajaran;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [d, setD] = useState<JadwalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJadwalDetail(jadwal.id)
      .then(setD)
      .catch(() => toast.error('Gagal memuat detail jadwal'))
      .finally(() => setLoading(false));
  }, [jadwal.id]);

  // Tampilkan data dari daftar dulu, lengkapi dengan detail setelah dimuat.
  const mapel = d?.mata_pelajaran ?? jadwal.mata_pelajaran;
  const kelas = d?.kelas ?? jadwal.kelas;
  const ustadz = d?.ustadz ?? jadwal.ustadz;

  return (
    <View className="flex-1 bg-canvas">
      <View
        style={{paddingTop: insets.top + 24}}
        className="bg-brand px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable onPress={onBack} hitSlop={10}>
            <ArrowLeft size={22} color={colors.brand.foreground} />
          </Pressable>
          <Text className="ml-3 text-title text-brand-foreground">
            Detail Jadwal
          </Text>
        </View>
        <Text className="mt-4 text-heading text-brand-foreground">
          {mapel?.nama ?? '-'}
        </Text>
        <Text className="mt-1 text-body text-brand-foreground opacity-90">
          {hariLabel(jadwal.hari)}, {hhmm(jadwal.jam_mulai)} –{' '}
          {hhmm(jadwal.jam_selesai)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator className="mb-3" color={colors.brand.DEFAULT} />
        ) : null}

        <Section icon={Clock} title="Waktu">
          <Row label="Hari" value={hariLabel(jadwal.hari)} />
          <Row
            label="Jam"
            value={`${hhmm(jadwal.jam_mulai)} – ${hhmm(jadwal.jam_selesai)}`}
          />
          <Row
            label="Durasi"
            value={durasi(jadwal.jam_mulai, jadwal.jam_selesai)}
          />
          <Row label="Semester" value={hariLabel(jadwal.semester)} />
        </Section>

        <Section icon={BookOpen} title="Mata Pelajaran">
          <Row label="Nama" value={mapel?.nama} />
          <Row label="Kode" value={mapel?.kode} />
          <Row
            label="Kategori"
            value={mapel?.kategori ? hariLabel(mapel.kategori) : null}
          />
          {d?.mata_pelajaran?.deskripsi ? (
            <Text className="mt-1 text-label text-ink-muted">
              {d.mata_pelajaran.deskripsi}
            </Text>
          ) : null}
        </Section>

        <Section icon={Users} title="Kelas">
          <Row label="Nama" value={kelas?.nama} />
          {d?.kelas ? (
            <>
              <Row
                label="Jenis kelamin"
                value={
                  d.kelas.jenis_kelamin === 'L'
                    ? 'Putra'
                    : d.kelas.jenis_kelamin === 'P'
                    ? 'Putri'
                    : null
                }
              />
              <Row
                label="Kapasitas"
                value={d.kelas.kapasitas ? `${d.kelas.kapasitas} santri` : null}
              />
            </>
          ) : null}
        </Section>

        <Section icon={GraduationCap} title="Pengajar">
          <View className="flex-row items-center py-2">
            <Avatar
              name={ustadz?.name}
              uri={d?.ustadz?.foto ?? undefined}
              size={44}
            />
            <View className="ml-3 flex-1">
              <Text className="text-body font-semibold text-ink">
                {ustadz?.name ?? '-'}
              </Text>
              {d?.ustadz?.jabatan ? (
                <Text className="text-caption text-ink-muted">
                  {d.ustadz.jabatan}
                </Text>
              ) : null}
            </View>
          </View>
          {d?.ustadz ? (
            <>
              <Row label="No. HP" value={d.ustadz.no_hp} />
              <Row label="Email" value={d.ustadz.email} />
            </>
          ) : null}
        </Section>
      </ScrollView>
    </View>
  );
}
