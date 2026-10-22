import {create} from 'zustand';
import type {DialogProps} from '@/components/ui/Dialog';

type Options = Omit<DialogProps, 'visible' | 'onConfirm' | 'onCancel'> & {
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogState = {
  options: Options | null;
  show: (options: Options) => void;
  hide: () => void;
};

export const useDialogStore = create<DialogState>(set => ({
  options: null,
  show: options => set({options}),
  hide: () => set({options: null}),
}));

/**
 * API imperatif, bisa dipanggil dari mana saja (pengganti Alert.alert).
 * Pastikan <DialogHost /> sudah dirender sekali di App.
 */
export const dialog = {
  alert: (options: Omit<Options, 'cancelText'>) =>
    useDialogStore.getState().show(options),
  confirm: (options: Options) =>
    useDialogStore.getState().show({cancelText: 'Batal', confirmText: 'Ya', ...options}),
};
