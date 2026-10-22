/**
 * Sumber tunggal token tema (warna, font, radius).
 * Dipakai oleh tailwind.config.js (className) dan oleh komponen (prop icon/svg).
 * Ubah di sini untuk mengganti tampilan seluruh aplikasi.
 */
const colors = {
  brand: {
    DEFAULT: '#3C82C3',
    dark: '#2D6AA8',
    light: '#EAF3FB',
    foreground: '#FFFFFF',
  },
  surface: '#FFFFFF',
  // Latar halaman (abu kebiruan) agar Card putih terlihat menonjol
  canvas: '#EEF2F7',
  line: '#E2E8F0',
  field: '#F8FAFC',
  text: {DEFAULT: '#1F2937', muted: '#6B7280'},
  // Tint ikon menu: bg = latar lingkaran, fg = warna ikon
  tint: {
    green: {bg: '#E3F1E8', fg: '#2F8F55'},
    blue: {bg: '#E4EEFB', fg: '#2F6FD0'},
    sky: {bg: '#E6F0F8', fg: '#3C82C3'},
    purple: {bg: '#EDE8F7', fg: '#6E4FB8'},
    teal: {bg: '#DFF3EE', fg: '#2A9D8F'},
    orange: {bg: '#FDEBDD', fg: '#E07B2E'},
    pink: {bg: '#FBE6EC', fg: '#D6336C'},
    gray: {bg: '#EEF0F3', fg: '#4B5563'},
  },
};

const fontFamily = {
  sans: ['System'],
};

const fontSize = {
  caption: ['11px', {lineHeight: '14px'}],
  label: ['12px', {lineHeight: '16px'}],
  body: ['14px', {lineHeight: '20px'}],
  title: ['16px', {lineHeight: '22px', fontWeight: '600'}],
  heading: ['20px', {lineHeight: '26px', fontWeight: '700'}],
};

const radius = {card: '14px', field: '10px', icon: '9999px'};

module.exports = {colors, fontFamily, fontSize, radius};
