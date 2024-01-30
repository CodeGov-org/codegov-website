import { ChangeDetectionStrategy, Component } from '@angular/core';

import { GLOBAL_CONFIG } from '../../../../global-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer-main">
        @for (category of globalConfig.footerLinks; track category.title) {
          <div class="footer-link-category-container">
            <h2 class="footer-link-category-title">{{ category.title }}</h2>

            <ul class="footer-link-category">
              @for (link of category.children; track link.title) {
                <li>
                  <a href="{link.content.cached_url}" class="footer-link">
                    {{ link.title }}
                  </a>
                </li>
              }
            </ul>
          </div>
        }
      </div>

      <div class="footer-copyright">
        <div class="footer-copyright-content">
          <span class="footer-copyright-text">
            © {{ currentYear }} CodeGov™. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  public globalConfig = GLOBAL_CONFIG;

  public currentYear = new Date().getFullYear();
}
