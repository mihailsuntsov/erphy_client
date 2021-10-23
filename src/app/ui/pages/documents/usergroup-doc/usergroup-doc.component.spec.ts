import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsergroupDocComponent } from './usergroup-doc.component';

describe('UsergroupDocComponent', () => {
  let component: UsergroupDocComponent;
  let fixture: ComponentFixture<UsergroupDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsergroupDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsergroupDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
