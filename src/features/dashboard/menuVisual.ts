import {
  Banknote,
  BedDouble,
  BookOpenCheck,
  CalendarCheck,
  GraduationCap,
  Info,
  LucideIcon,
  Users,
  ClipboardCheck,
  UserCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  CalendarDays,
  Trophy,
  TriangleAlert,
  FileCheck,
  NotebookPen,
  UsersRound,
  Mic,
  ChartColumn,
  UserRound,
  PiggyBank,
  ReceiptText,
} from 'lucide-react-native';
import type {TintName} from '@/theme';

/** Ikon + warna per menu (key mengacu ke navigation/menu.config.ts) */
export const MENU_VISUAL: Record<string, {icon: LucideIcon; tint: TintName}> = {
  santri: {icon: Users, tint: 'green'},
  akademik: {icon: GraduationCap, tint: 'blue'},
  kesantrian: {icon: ClipboardCheck, tint: 'sky'},
  asrama: {icon: BedDouble, tint: 'teal'},
  tahfidz: {icon: BookOpenCheck, tint: 'purple'},
  mutabaah: {icon: CalendarCheck, tint: 'orange'},
  keuangan: {icon: Banknote, tint: 'pink'},
  informasi: {icon: Info, tint: 'gray'},
};

/** Ikon sub menu (key mengacu ke children di navigation/menu.config.ts); warna mengikuti menu induk */
export const SUBMENU_ICON: Record<string, LucideIcon> = {
  absensi: UserCheck,
  jadwal: CalendarClock,
  nilai: ClipboardList,
  rapor: FileText,
  kalender: CalendarDays,
  prestasi: Trophy,
  pelanggaran: TriangleAlert,
  izin: FileCheck,
  catatan: NotebookPen,
  halaqoh: UsersRound,
  setoran: Mic,
  ringkasan: ChartColumn,
  'mutabaah-santri': UserRound,
  'mutabaah-asatidzah': UserCheck,
  tabungan: PiggyBank,
  spp: ReceiptText,
};
