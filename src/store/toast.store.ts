import {create} from 'zustand';

export type ToastType = 'success' | 'error';

type ToastState = {
  id: number;
  type: ToastType;
  message: string | null;
  show: (type: ToastType, message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>(set => ({
  id: 0,
  type: 'success',
  message: null,
  show: (type, message) => set(s => ({id: s.id + 1, type, message})),
  hide: () => set({message: null}),
}));

/** API imperatif, bisa dipanggil dari mana saja. Butuh <ToastHost /> di App. */
export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
};
