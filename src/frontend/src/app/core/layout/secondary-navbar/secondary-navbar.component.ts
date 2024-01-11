import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-secondary-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `<nav class="flex flex-row justify-between">
    <div class="flex flex-row">
      <!-- left aligned items -->
    </div>

    <div class="flex flex-row">
      @if (isAuthenticated$ | async) {
        <button (click)="onLogoutButtonClicked()">Logout</button>
      } @else {
        <button (click)="onLoginButtonClicked()">Login</button>
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
