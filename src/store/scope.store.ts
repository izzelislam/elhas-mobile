import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Unit dan kelas yang dipakai di aplikasi. Daftar kosong berarti "semua".
 * Dipakai pemilih santri agar pilihan unit/kelas hanya yang diatur di sini.
 */
type ScopeState = {
  unitIds: number[];
  kelasIds: number[];
  setUnitIds: (ids: number[]) => void;
  setKelasIds: (ids: number[]) => void;
  reset: () => void;
};

export const useScopeStore = create<ScopeState>()(
  persist(
    set => ({
      unitIds: [],
      kelasIds: [],
      setUnitIds: unitIds => set({unitIds}),
      setKelasIds: kelasIds => set({kelasIds}),
      reset: () => set({unitIds: [], kelasIds: []}),
    }),
    {name: 'scope', storage: createJSONStorage(() => AsyncStorage)},
  ),
);
