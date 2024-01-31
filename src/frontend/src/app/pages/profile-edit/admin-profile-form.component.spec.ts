import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { AdminProfileFormComponent } from './admin-profile-form.component';

describe('AdminProfileFormComponent', () => {
  let component: AdminProfileFormComponent;
  let fixture: ComponentFixture<AdminProfileFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [AdminProfileFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
