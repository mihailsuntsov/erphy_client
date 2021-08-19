import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryProductsTableComponent } from './inventory-products-table.component';

describe('InventoryProductsTableComponent', () => {
  let component: InventoryProductsTableComponent;
  let fixture: ComponentFixture<InventoryProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
