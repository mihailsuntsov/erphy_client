import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentinDocComponent } from './paymentin-doc.component';

describe('PaymentinDocComponent', () => {
  let component: PaymentinDocComponent;
  let fixture: ComponentFixture<PaymentinDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentinDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentinDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
