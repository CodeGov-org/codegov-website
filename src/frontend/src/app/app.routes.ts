import { type Routes } from '@angular/router';
import { isAuthenticatedGuard } from '@hadronous/ic-angular';

export const ROUTES: Routes = [
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
    canActivate: [isAuthenticatedGuard],
  },
  {
    path: 'proposals/open',
    loadComponent: () =>
      import('./pages/open-proposal-list').then(
        m => m.OpenProposalListComponent,
      ),
  },
  {
    path: 'proposals/open/:id',
    loadComponent: () =>
      import('./pages/open-proposal-details').then(
        m => m.OpenProposalDetailsComponent,
      ),
  },
];
