import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAttributeTermsComponent } from './product-attribute-terms.component';

describe('ProductCategoriesSelectComponent', () => {
  let component: ProductAttributeTermsComponent;
  let fixture: ComponentFixture<ProductAttributeTermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductAttributeTermsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAttributeTermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
