import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersupProductsTableComponent } from './ordersup-products-table.component';

describe('OrdersupProductsTableComponent', () => {
  let component: OrdersupProductsTableComponent;
  let fixture: ComponentFixture<OrdersupProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrdersupProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersupProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
