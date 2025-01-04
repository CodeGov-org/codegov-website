import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GLOBAL_CONFIG } from '../global-config';
import { FooterComponent, NavbarComponent } from '@cg/angular-ui';
import { SecondaryNavbarComponent } from '~core/layout';
import { ProfileService } from '~core/state';

@Component({
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
      @use '@cg/styles/common';

      .app-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .content-container {
        margin-left: auto;
        margin-right: auto;
        flex: 1;
        @include common.px(3);
        padding-top: common.size(6);
        padding-bottom: common.size(10);
        @include common.container;
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
export class AppComponent implements OnInit {
  public globalConfig = GLOBAL_CONFIG;
  public footerLinks = GLOBAL_CONFIG.footerLinks;
  public navbarLinks = GLOBAL_CONFIG.headerLinks;

  constructor(private readonly profileService: ProfileService) {}

  public ngOnInit(): void {
    this.profileService.loadCurrentUserProfile().catch(() => {
      // this error will be thrown if the user is not logged in, so we ignore it
    });
  }
}
