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
  styles: [
    `
      @import '@cg/styles/common';

      .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .content-container {
        @include container;
        margin-left: auto;
        margin-right: auto;
        flex: 1;
        @include px(3);
        padding-top: size(6);
        padding-bottom: size(10);
      }
    `,
  ],
  template: `
    <div class="app-container">
      <app-primary-navbar />
      <app-secondary-navbar />

      <main class="content-container">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `,
})
export class AppComponent {}
