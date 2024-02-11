import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/state';
import { AdminPersonalInfoViewComponent } from './admin-personal-info-view.component';

describe('AdminPersonalInfoViewComponent', () => {
  let component: AdminPersonalInfoViewComponent;
  let fixture: ComponentFixture<AdminPersonalInfoViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPersonalInfoViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPersonalInfoViewComponent);
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
