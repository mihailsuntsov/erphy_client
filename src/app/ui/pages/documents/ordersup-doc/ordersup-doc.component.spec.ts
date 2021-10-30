import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersupDocComponent } from './ordersup-doc.component';

describe('OrdersupDocComponent', () => {
  let component: OrdersupDocComponent;
  let fixture: ComponentFixture<OrdersupDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrdersupDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersupDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
