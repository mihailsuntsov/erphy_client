import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersupComponent } from './ordersup.component';

describe('OrdersupComponent', () => {
  let component: OrdersupComponent;
  let fixture: ComponentFixture<OrdersupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrdersupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
