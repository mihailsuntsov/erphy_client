import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCategoriesSelectComponent } from './product-categories-select.component';

describe('ProductCategoriesSelectComponent', () => {
  let component: ProductCategoriesSelectComponent;
  let fixture: ComponentFixture<ProductCategoriesSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductCategoriesSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCategoriesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
