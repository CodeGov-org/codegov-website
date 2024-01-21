import { type Routes } from '@angular/router';
import { isAuthenticatedGuard } from '@hadronous/ic-angular';

export const ROUTES: Routes = [
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
    canActivate: [isAuthenticatedGuard],
  },
];
