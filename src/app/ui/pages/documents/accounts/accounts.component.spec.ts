import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentAccountComponent } from './accounts.component';

describe('PaymentAccountComponent', () => {
  let component: PaymentAccountComponent;
  let fixture: ComponentFixture<PaymentAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
