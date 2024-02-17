import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

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
    LoginIconComponent,
    LogoutIconComponent,
    ProfileIconComponent,
    EditIconComponent,
    DropdownComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .secondary-navbar {
        background-color: $primary-950;
        @include layer-20;
        @include px(4);
        @include py(3);
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
        align-items: center;
      }

      .secondary-navbar__left {
        display: flex;
        flex: 1;
        flex-direction: row;
      }

      .secondary-navbar__right {
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
    `,
  ],
  template: `
    <nav class="secondary-navbar">
      <div class="secondary-navbar__inner">
        <div class="secondary-navbar__left">
          <!-- left aligned items -->
        </div>

        <div class="flex flex-row">
          @if (isAuthenticated$ | async) {
            <app-dropdown
              [showChevron]="false"
              menuTriggerClassName="btn btn--icon"
              aria-label="Open profile menu"
            >
              <ng-container ngProjectAs="[menuTrigger]">
                <app-profile-icon />
              </ng-container>

              <ng-container ngProjectAs="[menu]">
                <a
                  [routerLink]="'/profile/edit'"
                  class="dropdown__menu-item profile-menu__item"
                >
                  <app-edit-icon class="profile-menu__item-icon" />
                  Edit Profile
                </a>

                <button
                  (click)="onLogoutButtonClicked()"
                  class="dropdown__menu-item profile-menu__item"
                >
                  <app-logout-icon class="profile-menu__item-icon" />
                  Logout
                </button>
              </ng-container>
            </app-dropdown>
          } @else {
            <button
              (click)="onLoginButtonClicked()"
              class="btn btn--icon"
              aria-label="Log in"
            >
              <span class="sr-only">Login</span>
              <app-login-icon />
            </button>
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
