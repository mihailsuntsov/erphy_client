import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsergroupDockComponent } from './usergroup-dock.component';

describe('UsergroupDockComponent', () => {
  let component: UsergroupDockComponent;
  let fixture: ComponentFixture<UsergroupDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsergroupDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsergroupDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
