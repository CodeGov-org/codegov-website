import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  GLOBAL_CONFIG,
  Link,
  LinkCategory,
  isLinkCategory,
} from '../../../../global-config';
import {
  CollapsibleComponent,
  SidenavComponent,
  SidenavLink,
  SidenavLinkCategory,
} from '@cg/angular-ui';
import { DropdownComponent } from '~core/ui';

@Component({
  selector: 'app-primary-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DropdownComponent,
    CollapsibleComponent,
    SidenavComponent,
  ],
  styles: [
    `
      @import '@cg/styles/common';

      .sidenav {
        @include lg {
          display: none;
        }
      }
    `,
  ],
  template: `
    <header class="navbar">
      <div class="navbar__inner">
        <nav class="navbar__nav">
          <a [routerLink]="'/'" class="navbar__brand">
            <img
              class="navbar__logo"
              src="assets/codegov-logo.png"
              alt="CodeGov Logo"
            />

            codegov.org
          </a>

          <div class="navbar__desktop-nav">
            @for (
              item of globalConfig.headerLinks;
              track item.title;
              let i = $index
            ) {
              @if (isLinkCategory(item)) {
                <app-dropdown
                  menuTriggerClassName="navbar__nav-item"
                  [id]="'navbar-menu-' + i"
                >
                  <ng-container ngProjectAs="[menuTrigger]">
                    {{ item.title }}
                  </ng-container>

                  <ng-container ngProjectAs="[menu]">
                    @for (subItem of item.children; track subItem.title) {
                      <a
                        role="menuitem"
                        [href]="subItem.url"
                        class="dropdown__menu-item"
                      >
                        {{ subItem.title }}
                      </a>
                    }
                  </ng-container>
                </app-dropdown>
              } @else {
                <a [href]="item.url" class="navbar__nav-item">
                  {{ item.title }}
                </a>
              }
            }
          </div>

          <cg-sidenav class="sidenav" homeUrl="/" [links]="sidenavLinks" />
        </nav>
      </div>
    </header>
  `,
})
export class PrimaryNavbarComponent {
  public globalConfig = GLOBAL_CONFIG;

  public sidenavLinks = GLOBAL_CONFIG.headerLinks.map(
    mapToSidenavLinkOrCategory,
  );

  public isSidenavOpen = false;

  public isLinkCategory = isLinkCategory;

  public onSidenavOpenClicked(): void {
    this.isSidenavOpen = true;
  }

  public onSidenavCloseClicked(): void {
    this.isSidenavOpen = false;
  }
}

function mapToSidenavLinkOrCategory(
  link: Link | LinkCategory,
): SidenavLink | SidenavLinkCategory {
  return isLinkCategory(link)
    ? {
        title: link.title,
        children: link.children.map(mapToSidenavLink),
      }
    : mapToSidenavLink(link);
}

function mapToSidenavLink(link: Link): SidenavLink {
  return {
    title: link.title,
    url: link.url,
  };
}
