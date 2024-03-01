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
  {
    path: 'closed',
    loadComponent: () =>
      import('./pages/closed-proposal-list').then(
        m => m.ClosedProposalListComponent,
      ),
  },
  {
    path: 'review/:id/view',
    loadComponent: () =>
      import('./pages/view-proposal-review').then(
        m => m.ViewProposalReviewComponent,
      ),
  },
  {
    path: 'review/:id/edit',
    loadComponent: () =>
      import('./pages/edit-proposal-review').then(
        m => m.EditProposalReviewComponent,
      ),
  },
];
