import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSelectComponent } from './payment-select.component';

describe('PaymentSelectComponent', () => {
  let component: PaymentSelectComponent;
  let fixture: ComponentFixture<PaymentSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
