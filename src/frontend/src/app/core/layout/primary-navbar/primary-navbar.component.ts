import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GLOBAL_CONFIG, isLinkCategory } from '../../../../global-config';
import { CollapsibleComponent } from '@cg/angular-ui';
import {
  HamburgerMenuIconComponent,
  MenuCloseIconComponent,
} from '~core/icons';
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
    HamburgerMenuIconComponent,
    MenuCloseIconComponent,
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

          <div class="navbar__mobile-nav-trigger">
            <button
              type="button"
              class="navbar__mobile-nav-button"
              (click)="onSidenavOpenClicked()"
              aria-label="Open main menu"
            >
              <app-hamburger-menu-icon />
            </button>
          </div>
        </nav>

        <div
          class="navbar__mobile-nav"
          [ngClass]="{ 'navbar__mobile-nav--closed': !isSidenavOpen }"
          role="dialog"
          aria-modal="true"
        >
          <div class="backdrop" (click)="onSidenavCloseClicked()"></div>

          <div class="sidenav">
            <div class="sidenav__header">
              <a href="/" class="sidenav__brand">
                <img
                  class="sidenav__logo"
                  src="assets/codegov-logo.png"
                  alt="CodeGov Logo"
                />

                <span class="sidenav__company">codegov.org</span>
              </a>

              <button
                type="button"
                (click)="onSidenavCloseClicked()"
                aria-label="Close menu"
              >
                <app-menu-close-icon />
              </button>
            </div>

            <nav class="sidebar__nav">
              @for (item of globalConfig.headerLinks; track item.title) {
                @if (isLinkCategory(item)) {
                  <cg-collapsible>
                    <div slot="collapsibleTrigger">
                      {{ item.title }}
                    </div>

                    <div slot="collapsibleContent">
                      @for (subItem of item.children; track subItem.title) {
                        <a [href]="subItem.url" class="sidenav__item">
                          {{ subItem.title }}
                        </a>
                      }
                    </div>
                  </cg-collapsible>
                } @else {
                  <a [href]="item.url" class="sidenav__item">
                    {{ item.title }}
                  </a>
                }
              }
            </nav>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class PrimaryNavbarComponent {
  public globalConfig = GLOBAL_CONFIG;

  public isSidenavOpen = false;

  public isLinkCategory = isLinkCategory;

  public onSidenavOpenClicked(): void {
    this.isSidenavOpen = true;
  }

  public onSidenavCloseClicked(): void {
    this.isSidenavOpen = false;
  }
}
