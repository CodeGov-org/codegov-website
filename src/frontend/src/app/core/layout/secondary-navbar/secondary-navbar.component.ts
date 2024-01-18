import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

import {
  DropdownComponent,
  LoginIconComponent,
  LogoutIconComponent,
  ProfileIconComponent,
} from '~core/ui';

@Component({
  selector: 'app-secondary-navbar',
  standalone: true,
  imports: [
    CommonModule,
    LoginIconComponent,
    LogoutIconComponent,
    ProfileIconComponent,
    DropdownComponent,
  ],
  template: `<nav
    class="flex flex-row items-center justify-between bg-cyan-950 px-4 py-3 text-white shadow-lg dark:bg-slate-950 dark:text-slate-200"
  >
    <div class="flex flex-1 flex-row">
      <!-- left aligned items -->
    </div>

    <div class="flex flex-row">
      @if (isAuthenticated$ | async) {
        <app-dropdown [showChevron]="false" menuTriggerClassName="icon-btn">
          <ng-container ngProjectAs="[menuTrigger]">
            <app-profile-icon />
          </ng-container>

          <ng-container ngProjectAs="[menu]">
            <button
              (click)="onLogoutButtonClicked()"
              class="dropdown-item flex flex-row items-center"
            >
              <app-logout-icon class="mr-2" />
              Logout
            </button>
          </ng-container>
        </app-dropdown>
      } @else {
        <button (click)="onLoginButtonClicked()" class="icon-btn">
          <span class="sr-only">Login</span>
          <app-login-icon />
        </button>
      }
    </div>
  </nav>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryNavbarComponent {
  public readonly isAuthenticated$: Observable<boolean>;

  constructor(private readonly authService: IcAuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  public async onLoginButtonClicked(): Promise<void> {
    await this.authService.login();
  }

  public async onLogoutButtonClicked(): Promise<void> {
    await this.authService.logout();
  }
}
