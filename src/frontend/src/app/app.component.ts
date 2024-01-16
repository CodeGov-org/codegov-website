import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PrimaryNavbarComponent, SecondaryNavbarComponent } from '~core/layout';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    PrimaryNavbarComponent,
    SecondaryNavbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-primary-navbar />
    <app-secondary-navbar />
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
