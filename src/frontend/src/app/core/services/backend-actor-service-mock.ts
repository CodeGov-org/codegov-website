import { BackendActorService } from './backend-actor.service';

export type BackendActorServiceMock = jasmine.SpyObj<BackendActorService>;

export function backendActorServiceMockFactory(): BackendActorServiceMock {
  return jasmine.createSpyObj<BackendActorServiceMock>('BackendActorService', [
    'get_my_user_profile',
    'get_my_user_profile_history',
    'create_my_user_profile',
    'update_my_user_profile',

    'update_user_profile',

    'list_logs',

    'list_proposals',
    'sync_proposals',

    'create_proposal_review',
    'update_proposal_review',
    'list_proposal_reviews',
    'get_proposal_review',
    'get_my_proposal_review',

    'create_proposal_review_commit',
    'update_proposal_review_commit',
    'delete_proposal_review_commit',
  ]);
}
