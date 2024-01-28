import { BackendActorService } from './backend-actor.service';

export type BackendActorServiceMock = jasmine.SpyObj<BackendActorService>;

export function backendActorServiceMockFactory(): BackendActorServiceMock {
  return jasmine.createSpyObj<BackendActorService>('BackendActorService', [
    'create_my_user_profile',
    'get_my_user_profile',
    'get_my_user_profile_history',
    'update_my_user_profile',
    'update_user_profile',
  ]);
}
