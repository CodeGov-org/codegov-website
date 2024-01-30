import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  FooterComponent,
  PrimaryNavbarComponent,
  SecondaryNavbarComponent,
} from '~core/layout';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    PrimaryNavbarComponent,
    SecondaryNavbarComponent,
    FooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full min-h-[100vh] flex-col">
      <app-primary-navbar />
      <app-secondary-navbar />

      <main class="container mx-auto flex-1 px-4 py-5">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `,
})
export class AppComponent {}
