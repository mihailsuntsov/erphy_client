import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersDocComponent } from './users-doc.component';

describe('UsersDocComponent', () => {
  let component: UsersDocComponent;
  let fixture: ComponentFixture<UsersDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
