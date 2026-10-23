/**
 * Daftar tema warna yang bisa dipilih pengguna (Akun → Tema Warna).
 * Hanya warna brand yang berganti; netral (latar, teks, garis) dan tint ikon tetap.
 * Untuk menambah atau mengubah tema, cukup edit daftar ini (format hex).
 *   DEFAULT    : warna utama (header, tombol, tab aktif)
 *   dark       : varian lebih gelap
 *   light      : latar lembut (chip, sorotan)
 *   foreground : warna teks/ikon di atas warna utama
 */
const themes = [
  {
    id: 'biru',
    name: 'Biru Samudra',
    brand: {DEFAULT: '#3C82C3', dark: '#2D6AA8', light: '#EAF3FB', foreground: '#FFFFFF'},
  },
  {
    id: 'hijau',
    name: 'Hijau Zamrud',
    brand: {DEFAULT: '#2F8F55', dark: '#23703F', light: '#E6F4EC', foreground: '#FFFFFF'},
  },
  {
    id: 'teal',
    name: 'Tosca',
    brand: {DEFAULT: '#1F9E96', dark: '#177A74', light: '#E1F5F3', foreground: '#FFFFFF'},
  },
  {
    id: 'ungu',
    name: 'Ungu Anggur',
    brand: {DEFAULT: '#6E4FB8', dark: '#573C96', light: '#EEE9F8', foreground: '#FFFFFF'},
  },
  {
    id: 'oranye',
    name: 'Oranye Senja',
    brand: {DEFAULT: '#D9701F', dark: '#B25A17', light: '#FCEEE1', foreground: '#FFFFFF'},
  },
  {
    id: 'merah',
    name: 'Merah Marun',
    brand: {DEFAULT: '#B83A4B', dark: '#932E3C', light: '#F9E9EB', foreground: '#FFFFFF'},
  },
  {
    id: 'nila',
    name: 'Nila Malam',
    brand: {DEFAULT: '#3F4FA8', dark: '#313E85', light: '#E8EBF8', foreground: '#FFFFFF'},
  },
  {
    id: 'cokelat',
    name: 'Cokelat Tanah',
    brand: {DEFAULT: '#8A5A3C', dark: '#6D472F', light: '#F4ECE6', foreground: '#FFFFFF'},
  },
];

module.exports = {themes};
