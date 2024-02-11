import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService, UserRole } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { AdminPersonalInfoEditComponent } from './admin-personal-info-edit.component';

describe('AdminPersonalInfoEditComponent', () => {
  let component: AdminPersonalInfoEditComponent;
  let fixture: ComponentFixture<AdminPersonalInfoEditComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPersonalInfoEditComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPersonalInfoEditComponent);
    component = fixture.componentInstance;
    component.userProfile = {
      id: '1',
      role: UserRole.Admin,
      username: 'TestReviewer',
      bio: 'bio',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
