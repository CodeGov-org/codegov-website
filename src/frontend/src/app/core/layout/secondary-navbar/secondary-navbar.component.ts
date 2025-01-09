import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

import {
  IconBtnComponent,
  DropdownComponent,
  DropdownBtnMenuItemComponent,
  DropdownLinkMenuItemComponent,
  DropdownMenuComponent,
  DropdownTriggerComponent,
  ProfileIconComponent,
} from '@cg/angular-ui';
import {
  LoginIconComponent,
  LogoutIconComponent,
  EditIconComponent,
} from '~core/icons';
import { UserAuthService } from '~core/services';

@Component({
  selector: 'app-secondary-navbar',
  imports: [
    CommonModule,
    RouterModule,
    IconBtnComponent,
    LoginIconComponent,
    LogoutIconComponent,
    ProfileIconComponent,
    EditIconComponent,
    DropdownComponent,
    DropdownBtnMenuItemComponent,
    DropdownLinkMenuItemComponent,
    DropdownMenuComponent,
    DropdownTriggerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    .secondary-navbar {
      background-color: common.$primary-950;
      @include common.layer-20;
      color: common.$white;

      @include common.dark {
        background-color: common.$slate-900;
        color: common.$slate-200;
      }
    }

    .secondary-navbar__inner {
      margin-left: auto;
      margin-right: auto;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      @include common.container;
    }

    .secondary-navbar__left {
      padding-left: common.size(4);
      display: flex;
      flex: 1;
      flex-direction: row;
      align-items: end;
    }

    .secondary-navbar__right {
      @include common.py(3);
      padding-right: common.size(4);
      display: flex;
      flex-direction: row;
    }

    .profile-menu__item {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .profile-menu__item-icon {
      margin-right: common.size(2);
    }

    .secondary-navbar__link {
      color: common.$white;

      @include common.no-underline;
      @include common.py(2);
      @include common.mx(4);
      border-bottom: 3px solid transparent;

      &:hover {
        border-color: common.$slate-400;

        @include common.dark {
          border-color: common.$slate-700;
        }
      }
    }

    .active-link,
    .active-link:hover {
      color: common.$primary-400;
      border-color: common.$primary-400;

      @include common.dark {
        color: common.$primary;
        border-color: common.$primary;
      }
    }
  `,
  template: `
    <nav class="secondary-navbar">
      <div class="secondary-navbar__inner">
        <div class="secondary-navbar__left"></div>

        <div class="secondary-navbar__right">
          @if (isAuthenticated()) {
            <cg-dropdown anchorAlign="right">
              <cg-dropdown-trigger
                [isIconBtn]="true"
                btnLabel="Open profile menu"
                slot="dropdownTrigger"
              >
                <cg-profile-icon />
              </cg-dropdown-trigger>

              <cg-dropdown-menu slot="dropdownMenu">
                <cg-dropdown-link-menu-item [routerLink]="'/profile/edit'">
                  <app-edit-icon
                    class="profile-menu__item-icon"
                    aria-hidden="true"
                  />

                  Edit profile
                </cg-dropdown-link-menu-item>

                <cg-dropdown-btn-menu-item (click)="onLogoutButtonClicked()">
                  <app-logout-icon
                    class="profile-menu__item-icon"
                    aria-hidden="true"
                  />
                  Logout
                </cg-dropdown-btn-menu-item>
              </cg-dropdown-menu>
            </cg-dropdown>
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
  public readonly isAuthenticated = toSignal(this.authService.isAuthenticated$);

  constructor(private readonly authService: UserAuthService) {}

  public async onLoginButtonClicked(): Promise<void> {
    await this.authService.login();
  }

  public async onLogoutButtonClicked(): Promise<void> {
    await this.authService.logout();
  }
}
