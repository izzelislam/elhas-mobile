const {hairlineWidth} = require('nativewind/theme');
const tokens = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      colors: {
        // Warna brand mengikuti tema aktif lewat variabel CSS (lihat src/theme/themes.js)
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          light: 'rgb(var(--brand-light) / <alpha-value>)',
          foreground: 'rgb(var(--brand-foreground) / <alpha-value>)',
        },
        surface: tokens.colors.surface,
        canvas: tokens.colors.canvas,
        line: tokens.colors.line,
        field: tokens.colors.field,
        ink: tokens.colors.text,
        tint: tokens.colors.tint,
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))'},
        secondary: {DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))'},
        destructive: {DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))'},
        muted: {DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))'},
        accent: {DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))'},
        popover: {DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))'},
        card: {DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))'},
      },
      borderRadius: {...tokens.radius, lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)'},
      borderWidth: {hairline: hairlineWidth()},
    },
  },
  plugins: [require('tailwindcss-animate')],
};
