import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentoutDocComponent } from './paymentout-doc.component';

describe('PaymentoutDocComponent', () => {
  let component: PaymentoutDocComponent;
  let fixture: ComponentFixture<PaymentoutDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentoutDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentoutDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
