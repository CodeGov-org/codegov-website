import { type Routes } from '@angular/router';
import { isAuthenticatedGuard } from '@hadronous/ic-angular';

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'open',
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
    canActivate: [isAuthenticatedGuard],
  },
  {
    path: 'open',
    loadComponent: () =>
      import('./pages/open-proposal-list').then(
        m => m.OpenProposalListComponent,
      ),
  },
  {
    path: 'open/:id',
    loadComponent: () =>
      import('./pages/open-proposal-details').then(
        m => m.OpenProposalDetailsComponent,
      ),
  },
];
