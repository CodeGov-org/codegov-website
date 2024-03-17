import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GLOBAL_CONFIG } from 'src/global-config';

import { FooterComponent } from '@cg/angular-ui';
import { PrimaryNavbarComponent, SecondaryNavbarComponent } from '~core/layout';

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

      <cg-footer [links]="footerLinks">
        <div slot="footerCopyright">
          © {{ currentYear }} CodeGov™. All Rights Reserved.
        </div>
      </cg-footer>
    </div>
  `,
})
export class AppComponent {
  public globalConfig = GLOBAL_CONFIG;
  public footerLinks = GLOBAL_CONFIG.footerLinks;
  public currentYear = new Date().getFullYear();
}
