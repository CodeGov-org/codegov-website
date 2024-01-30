import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GLOBAL_CONFIG, isLinkCategory } from '../../../../global-config';
import {
  CollapsibleComponent,
  DropdownComponent,
  MenuCloseIconComponent,
} from '~core/ui';
import { HamburgerMenuIconComponent } from '~core/ui';

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
      <div class="container mx-auto">
        <nav class="navbar-nav">
          <a routerLink="/" class="navbar-brand">
            <img
              class="navbar-logo"
              src="assets/codegov-logo.png"
              alt="CodeGov Logo"
            />

            <span class="navbar-company">codegov.org</span>
          </a>

          <div class="navbar-desktop-nav">
            @for (item of globalConfig.headerLinks; track item.title) {
              @if (isLinkCategory(item)) {
                <app-dropdown menuTriggerClassName="navbar-nav-item">
                  <ng-container ngProjectAs="[menuTrigger]">
                    {{ item.title }}
                  </ng-container>

                  <ng-container ngProjectAs="[menu]">
                    @for (subItem of item.children; track subItem.title) {
                      <a [href]="subItem.url" class="dropdown-item">
                        {{ subItem.title }}
                      </a>
                    }
                  </ng-container>
                </app-dropdown>
              } @else {
                <a [href]="item.url" class="navbar-nav-item">
                  {{ item.title }}
                </a>
              }
            }
          </div>

          <div class="navbar-mobile-nav-trigger">
            <button type="button" (click)="onSidenavOpenClicked()">
              <span class="sr-only">Open main menu</span>
              <app-hamburger-menu-icon />
            </button>
          </div>
        </nav>

        <div
          class="navbar-mobile-nav"
          [ngClass]="{ hidden: !isSidenavOpen }"
          role="dialog"
          aria-modal="true"
        >
          <div class="sidenav-backdrop" (click)="onSidenavCloseClicked()"></div>

          <div class="sidenav">
            <div class="sidenav-header">
              <a href="/" class="sidenav-brand">
                <img
                  class="sidenav-logo"
                  src="assets/codegov-logo.png"
                  alt="CodeGov Logo"
                />

                <span class="sidenav-company">codegov.org</span>
              </a>

              <button type="button" (click)="onSidenavCloseClicked()">
                <span class="sr-only">Close menu</span>
                <app-menu-close-icon />
              </button>
            </div>

            <nav class="sidebar-nav">
              @for (item of globalConfig.headerLinks; track item.title) {
                @if (isLinkCategory(item)) {
                  <app-collapsible>
                    <ng-container ngProjectAs="[header]">
                      {{ item.title }}
                    </ng-container>

                    <ng-container ngProjectAs="[body]">
                      @for (subItem of item.children; track subItem.title) {
                        <a [href]="subItem.url" class="sidenav-item">
                          {{ subItem.title }}
                        </a>
                      }
                    </ng-container>
                  </app-collapsible>
                } @else {
                  <a [href]="item.url" class="sidenav-item">
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
