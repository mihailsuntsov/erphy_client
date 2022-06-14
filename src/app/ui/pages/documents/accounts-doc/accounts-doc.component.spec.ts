import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentAccountDocComponent } from './accounts-doc.component';

describe('PaymentAccountDocComponent', () => {
  let component: PaymentAccountDocComponent;
  let fixture: ComponentFixture<PaymentAccountDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentAccountDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentAccountDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
