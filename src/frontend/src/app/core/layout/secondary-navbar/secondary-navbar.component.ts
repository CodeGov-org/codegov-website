import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { CgIconBtnComponent } from '@cg/angular-ui';
import {
  LoginIconComponent,
  LogoutIconComponent,
  ProfileIconComponent,
  EditIconComponent,
} from '~core/icons';
import { UserAuthService } from '~core/services';
import { DropdownComponent, TooltipDirective } from '~core/ui';

@Component({
  selector: 'app-secondary-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CgIconBtnComponent,
    LoginIconComponent,
    LogoutIconComponent,
    ProfileIconComponent,
    EditIconComponent,
    DropdownComponent,
    TooltipDirective,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .secondary-navbar {
        background-color: $primary-950;
        @include layer-20;
        color: $white;

        @include dark {
          background-color: $slate-900;
          color: $slate-200;
        }
      }

      .secondary-navbar__inner {
        @include container;
        margin-left: auto;
        margin-right: auto;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      .secondary-navbar__left {
        padding-left: size(4);
        display: flex;
        flex: 1;
        flex-direction: row;
        align-items: end;
      }

      .secondary-navbar__right {
        @include py(3);
        padding-right: size(4);
        display: flex;
        flex-direction: row;
      }

      .profile-menu__item {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .profile-menu__item-icon {
        margin-right: size(2);
      }

      .secondary-navbar__link {
        color: $white;

        @include no-underline;
        @include py(2);
        @include mx(4);
        border-bottom: 3px solid transparent;

        &:hover {
          border-color: $slate-400;

          @include dark {
            border-color: $slate-700;
          }
        }
      }

      .active-link,
      .active-link:hover {
        color: $primary-400;
        border-color: $primary-400;

        @include dark {
          color: $primary;
          border-color: $primary;
        }
      }
    `,
  ],
  template: `
    <nav class="secondary-navbar">
      <div class="secondary-navbar__inner">
        <div class="secondary-navbar__left">
          <a
            class="secondary-navbar__link"
            [routerLink]="['/open']"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Review period open
          </a>
          <a
            class="secondary-navbar__link"
            [routerLink]="['/closed']"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            Review period closed
          </a>
        </div>

        <div class="secondary-navbar__right">
          @if (isAuthenticated$ | async) {
            <app-dropdown
              [showChevron]="false"
              menuTriggerClassName="btn btn--icon"
              ariaLabel="Open profile menu"
              id="profile-menu"
            >
              <ng-container ngProjectAs="[menuTrigger]">
                <app-profile-icon aria-hidden="true" />
              </ng-container>

              <ng-container ngProjectAs="[menu]">
                <a
                  [routerLink]="'/profile/edit'"
                  class="dropdown__menu-item profile-menu__item"
                  role="menuitem"
                >
                  <app-edit-icon
                    class="profile-menu__item-icon"
                    aria-hidden="true"
                  />

                  Edit profile
                </a>

                <button
                  (click)="onLogoutButtonClicked()"
                  class="dropdown__menu-item profile-menu__item"
                  role="menuitem"
                >
                  <app-logout-icon
                    class="profile-menu__item-icon"
                    aria-hidden="true"
                  />
                  Logout
                </button>
              </ng-container>
            </app-dropdown>
          } @else {
            <cg-icon-btn (click)="onLoginButtonClicked()" label="Log in">
              <app-login-icon />
            </cg-icon-btn>
          }
        </div>
      </div>
    </nav>
  `,
})
export class SecondaryNavbarComponent {
  public readonly isAuthenticated$: Observable<boolean>;

  constructor(private readonly authService: UserAuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  public async onLoginButtonClicked(): Promise<void> {
    await this.authService.login();
  }

  public async onLogoutButtonClicked(): Promise<void> {
    await this.authService.logout();
  }
}
