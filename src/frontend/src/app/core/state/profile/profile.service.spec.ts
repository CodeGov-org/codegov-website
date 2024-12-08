import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ProfileApiService } from '../../api';
import {
  ProfileApiServiceMock,
  profileApiServiceMockFactory,
} from '~core/api/profile/profile-api.service.mock';
import {
  DialogMock,
  dialogMockFactory,
  RouterMock,
  routerMockFactory,
} from '~testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  let profileApiServiceMock: ProfileApiServiceMock;
  let routerMock: RouterMock;
  let dialogMock: DialogMock;

  beforeEach(() => {
    profileApiServiceMock = profileApiServiceMockFactory();
    routerMock = routerMockFactory();
    dialogMock = dialogMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileApiService, useValue: profileApiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Dialog, useValue: dialogMock },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
