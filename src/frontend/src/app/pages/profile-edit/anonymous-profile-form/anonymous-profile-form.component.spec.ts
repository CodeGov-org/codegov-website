import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { AnonymousProfileFormComponent } from './anonymous-profile-form.component';

describe('AnonymousProfileFormComponent', () => {
  let component: AnonymousProfileFormComponent;
  let fixture: ComponentFixture<AnonymousProfileFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [AnonymousProfileFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
