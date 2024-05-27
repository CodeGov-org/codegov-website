export interface Toast {
  title: string;
  message: string;
  type: ToastType;
  durationInMs: number;
}

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}
