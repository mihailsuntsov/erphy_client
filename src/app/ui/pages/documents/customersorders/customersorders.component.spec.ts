import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersordersComponent } from './customersorders.component';

describe('CustomersordersComponent', () => {
  let component: CustomersordersComponent;
  let fixture: ComponentFixture<CustomersordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomersordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
