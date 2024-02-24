import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkMode: boolean;

  constructor() {
    this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  public isDarkMode(): boolean {
    return this.darkMode;
  }

  public setDarkMode(isDarkMode: boolean): void {
    this.darkMode = isDarkMode;
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
