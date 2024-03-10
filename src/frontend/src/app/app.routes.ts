import { type Routes } from '@angular/router';
import { isAuthenticatedGuard } from '@hadronous/ic-angular';

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'proposal',
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
    canActivate: [isAuthenticatedGuard],
  },
  {
    path: 'proposal',
    loadComponent: () =>
      import('./pages/proposal-list').then(m => m.ProposalListComponent),
  },
  {
    path: 'open/:id',
    loadComponent: () =>
      import('./pages/open-proposal-details').then(
        m => m.OpenProposalDetailsComponent,
      ),
  },
  {
    path: 'review/:id/view',
    loadComponent: () =>
      import('./pages/proposal-review').then(m => m.ProposalReviewComponent),
  },
  {
    path: 'review/:id/edit',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/proposal-review-edit').then(
        m => m.ProposalReviewEditComponent,
      ),
  },
];
