import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
  },
];
