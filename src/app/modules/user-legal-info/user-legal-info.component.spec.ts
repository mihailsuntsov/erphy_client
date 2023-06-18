import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLegalInfoComponent } from './user-legal-info.component';

describe('UserLegalInfoComponent', () => {
  let component: UserLegalInfoComponent;
  let fixture: ComponentFixture<UserLegalInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserLegalInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserLegalInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
