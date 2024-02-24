import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DarkModeIconComponent, LightModeIconComponent } from '~core/icons';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [DarkModeIconComponent, LightModeIconComponent],
  template: `
    <button type="button" (click)="toggleDarkTheme()" aria-label="Toggle theme">
      @if (isDarkMode) {
        <app-lightmode-icon />
      } @else {
        <app-darkmode-icon />
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  public isDarkMode: boolean;

  constructor(private themeService: ThemeService) {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  public toggleDarkTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setDarkMode(this.isDarkMode);
  }
}
