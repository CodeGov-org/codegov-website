import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/state';
import { AdminPersonalInfoComponent } from './admin-personal-info.component';

describe('AdminPersonalInfoComponent', () => {
  let component: AdminPersonalInfoComponent;
  let fixture: ComponentFixture<AdminPersonalInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPersonalInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPersonalInfoComponent);
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
