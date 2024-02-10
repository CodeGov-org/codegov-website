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
  template: `<nav
    class="bg-primary-950 layer-20 px-4 py-3 text-white dark:bg-slate-900 dark:text-slate-200"
  >
    <div class="container mx-auto flex flex-row items-center justify-between">
      <div class="flex flex-1 flex-row">
        <!-- left aligned items -->
      </div>

      <div class="flex flex-row">
        @if (isAuthenticated$ | async) {
          <app-dropdown
            [showChevron]="false"
            menuTriggerClassName="btn btn-icon"
          >
            <ng-container ngProjectAs="[menuTrigger]">
              <app-profile-icon />
            </ng-container>

            <ng-container ngProjectAs="[menu]">
              <a
                [routerLink]="'/profile/edit'"
                class="dropdown-item flex flex-row items-center"
              >
                <app-edit-icon class="mr-2" />Edit Profile</a
              >

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
          <button
            (click)="onLoginButtonClicked()"
            class="btn btn-icon"
            [appTooltip]="tooltipText"
          >
            <span class="sr-only">Login</span>
            <app-login-icon />
          </button>
        }
      </div>
    </div>
  </nav>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryNavbarComponent {
  public readonly isAuthenticated$: Observable<boolean>;
  public readonly tooltipText = 'Log in to CodeGov';

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
