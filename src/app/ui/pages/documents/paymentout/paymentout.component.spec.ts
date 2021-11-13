import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentoutComponent } from './paymentout.component';

describe('PaymentoutComponent', () => {
  let component: PaymentoutComponent;
  let fixture: ComponentFixture<PaymentoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
