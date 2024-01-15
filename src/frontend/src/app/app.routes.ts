import { type Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
  },
];
