export type DialogType = 'success' | 'error' | 'info';

export interface AppDialogData {
  type: DialogType;
  title: string;
  message: string;
  confirmText?: string;
}