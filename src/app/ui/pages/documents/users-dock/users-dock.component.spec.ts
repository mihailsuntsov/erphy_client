import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersDockComponent } from './users-dock.component';

describe('UsersDockComponent', () => {
  let component: UsersDockComponent;
  let fixture: ComponentFixture<UsersDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
