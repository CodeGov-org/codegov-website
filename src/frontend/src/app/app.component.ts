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

      .footer__link-category-container {
        @include py(3);

        @include md {
          @include py(5);
        }
      }

      .footer__link-category-title {
        @include text-md;
        font-weight: $font-weight-medium;
        text-transform: uppercase;

        color: $slate-900;
        @include dark {
          color: $white;
        }
      }

      .footer__link-category {
        list-style: none;
        font-weight: $font-weight-medium;
        padding: 0;
        margin: 0;

        color: $slate-500;
        @include dark {
          color: $slate-400;
        }
      }

      .footer__link {
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
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

      <cg-footer>
        <div slot="footerMain">
          @for (category of globalConfig.footerLinks; track category.title) {
            <div class="footer__link-category-container">
              <h2 class="footer__link-category-title">{{ category.title }}</h2>

              <ul class="footer__link-category">
                @for (link of category.children; track link.title) {
                  <li>
                    <a href="{link.content.cached_url}" class="footer__link">
                      {{ link.title }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <div slot="footerCopyright">
          © {{ currentYear }} CodeGov™. All Rights Reserved.
        </div>
      </cg-footer>
    </div>
  `,
})
export class AppComponent {
  public globalConfig = GLOBAL_CONFIG;

  public currentYear = new Date().getFullYear();
}
