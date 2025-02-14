import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { UserRole } from '~core/api';
import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { AdminProfileComponent } from './admin-profile.component';

describe('AdminProfileComponent', () => {
  let component: AdminProfileComponent;
  let fixture: ComponentFixture<AdminProfileComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [AdminProfileComponent, RouterModule],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userProfile', {
      id: '1',
      role: UserRole.Admin,
      username: 'TestAdmin',
      bio: 'bio',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
