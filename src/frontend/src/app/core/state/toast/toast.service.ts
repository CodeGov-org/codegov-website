import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Toast, ToastType } from './toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  public readonly toast$ = this.toastSubject.asObservable();

  public async show(
    title: string,
    message: string,
    type: ToastType,
    durationInMs = 5000,
  ): Promise<void> {
    const toast = {
      title: title,
      message: message,
      type: type,
      durationInMs: durationInMs,
    };

    this.toastSubject.next(toast);
    setTimeout(() => this.toastSubject.next(null)), durationInMs;
  }

  public close(): void {
    this.toastSubject.next(null);
  }
}
