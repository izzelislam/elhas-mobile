import React from 'react';
import {useDialogStore} from '@/store/dialog.store';
import {Dialog} from './Dialog';

export function DialogHost() {
  const {options, hide} = useDialogStore();
  if (!options) {
    return null;
  }
  const {onConfirm, onCancel, ...rest} = options;
  return (
    <Dialog
      {...rest}
      visible
      onConfirm={() => {
        hide();
        onConfirm?.();
      }}
      onCancel={() => {
        hide();
        onCancel?.();
      }}
    />
  );
}
