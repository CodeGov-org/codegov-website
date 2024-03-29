import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GLOBAL_CONFIG } from 'src/global-config';

import { FooterComponent, NavbarComponent } from '@cg/angular-ui';
import { SecondaryNavbarComponent } from '~core/layout';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
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
      <cg-navbar [homeUrl]="'/'" [links]="navbarLinks" />
      <app-secondary-navbar />

      <main class="content-container">
        <router-outlet />
      </main>
      <cg-footer [links]="footerLinks" />
    </div>
  `,
})
export class AppComponent {
  public globalConfig = GLOBAL_CONFIG;
  public footerLinks = GLOBAL_CONFIG.footerLinks;
  public navbarLinks = GLOBAL_CONFIG.headerLinks;
}
