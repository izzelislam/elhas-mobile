type Tint = {bg: string; fg: string};
export const colors: {
  brand: {DEFAULT: string; dark: string; light: string; foreground: string};
  surface: string;
  canvas: string;
  line: string;
  field: string;
  text: {DEFAULT: string; muted: string};
  tint: Record<
    'green' | 'blue' | 'sky' | 'purple' | 'teal' | 'orange' | 'pink' | 'gray',
    Tint
  >;
};
export const fontFamily: Record<string, string[]>;
export const fontSize: Record<string, unknown>;
export const radius: Record<string, string>;
