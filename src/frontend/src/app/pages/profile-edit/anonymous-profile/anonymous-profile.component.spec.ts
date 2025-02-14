import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/api';
import { AnonymousProfileComponent } from './anonymous-profile.component';

describe('AnonymousProfileComponent', () => {
  let component: AnonymousProfileComponent;
  let fixture: ComponentFixture<AnonymousProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousProfileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userProfile', {
      id: '1',
      role: UserRole.Anonymous,
      username: 'TestAnon',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
