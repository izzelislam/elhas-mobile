import {create} from 'zustand';
import type {Setoran} from './types';

/** Setoran yang sedang dibuka di layar detail; dipakai bersama oleh daftar Setoran, Halaqah, dan Ringkasan. */
type SetoranDetailState = {
  selected: Setoran | null;
  open: (item: Setoran) => void;
  close: () => void;
};

export const useSetoranDetail = create<SetoranDetailState>(set => ({
  selected: null,
  open: item => set({selected: item}),
  close: () => set({selected: null}),
}));
