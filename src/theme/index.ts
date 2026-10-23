import {vars} from 'nativewind';
import {colors as baseColors} from './tokens';
import {themes, type BrandPalette, type Theme} from './themes';

export {themes};
export type {Theme};
export type TintName = keyof typeof baseColors.tint;

let active: Theme = themes[0];

export const getTheme = (id: string): Theme =>
  themes.find(t => t.id === id) ?? themes[0];

/** Dipanggil store tema; `colors.brand` langsung mengikuti tema aktif. */
export const setActiveTheme = (id: string) => {
  active = getTheme(id);
};

/** Token warna untuk prop ikon/svg. `brand` selalu mengikuti tema aktif. */
export const colors = {
  ...baseColors,
  get brand(): BrandPalette {
    return active.brand;
  },
};

/** "#3C82C3" → "60 130 195" (format variabel CSS yang dipakai tailwind.config). */
const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** Style variabel CSS untuk NativeWind; pasang di root agar kelas bg-brand dkk berganti. */
export const themeVars = (id: string) => {
  const {brand} = getTheme(id);
  return vars({
    '--brand': rgb(brand.DEFAULT),
    '--brand-dark': rgb(brand.dark),
    '--brand-light': rgb(brand.light),
    '--brand-foreground': rgb(brand.foreground),
  });
};
