export type BrandPalette = {DEFAULT: string; dark: string; light: string; foreground: string};
export type Theme = {id: string; name: string; brand: BrandPalette};
export const themes: Theme[];
