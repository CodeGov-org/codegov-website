import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-primary-navbar',
  standalone: true,
  template: `<header>CodeGov</header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryNavbarComponent {}
