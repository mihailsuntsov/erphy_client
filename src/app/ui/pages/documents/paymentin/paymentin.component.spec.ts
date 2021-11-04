import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentinComponent } from './paymentin.component';

describe('PaymentinComponent', () => {
  let component: PaymentinComponent;
  let fixture: ComponentFixture<PaymentinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
