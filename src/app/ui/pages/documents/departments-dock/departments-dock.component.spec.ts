import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentsDockComponent } from './departments-dock.component';

describe('DepartmentsDockComponent', () => {
  let component: DepartmentsDockComponent;
  let fixture: ComponentFixture<DepartmentsDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentsDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentsDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
