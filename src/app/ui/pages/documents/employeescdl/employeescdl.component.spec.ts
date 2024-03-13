import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeScdlComponent } from './employeescdl.component';

describe('EmpluyeeScdlComponent', () => {
  let component: EmployeeScdlComponent;
  let fixture: ComponentFixture<EmployeeScdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeScdlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeScdlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
