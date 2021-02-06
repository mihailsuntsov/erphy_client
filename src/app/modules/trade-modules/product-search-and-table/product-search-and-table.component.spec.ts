import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSearchAndTableComponent } from './product-search-and-table.component';

describe('ProductSearchAndTableComponent', () => {
  let component: ProductSearchAndTableComponent;
  let fixture: ComponentFixture<ProductSearchAndTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductSearchAndTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSearchAndTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
