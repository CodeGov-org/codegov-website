import { type Routes } from '@angular/router';
import { isAuthenticatedGuard } from '@hadronous/ic-angular';

export const ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/proposal-list').then(m => m.ProposalListComponent),
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./pages/profile-edit').then(m => m.ProfileEditComponent),
    canActivate: [isAuthenticatedGuard],
  },
  {
    path: ':proposalId',
    loadComponent: () =>
      import('./pages/proposal-details').then(m => m.ProposalDetailsComponent),
  },
  {
    path: 'review/:reviewId/view',
    loadComponent: () =>
      import('./pages/proposal-review').then(m => m.ProposalReviewComponent),
  },
  {
    path: 'review/:proposalId/edit',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/proposal-review-edit').then(
        m => m.ProposalReviewEditComponent,
      ),
    canActivate: [isAuthenticatedGuard],
  },
];
