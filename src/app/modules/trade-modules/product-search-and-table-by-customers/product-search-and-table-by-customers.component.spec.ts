import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSearchAndTableByCustomersComponent } from './product-search-and-table-by-customers.component';

describe('ProductSearchAndTableByCustomersComponent', () => {
  let component: ProductSearchAndTableByCustomersComponent;
  let fixture: ComponentFixture<ProductSearchAndTableByCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductSearchAndTableByCustomersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSearchAndTableByCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
