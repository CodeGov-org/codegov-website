import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/api';
import { ProfileService } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { AdminPersonalInfoFormComponent } from './admin-personal-info-form.component';

describe('AdminPersonalInfoFormComponent', () => {
  let component: AdminPersonalInfoFormComponent;
  let fixture: ComponentFixture<AdminPersonalInfoFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPersonalInfoFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPersonalInfoFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userProfile', {
      id: '1',
      role: UserRole.Admin,
      username: 'TestReviewer',
      bio: 'bio',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
