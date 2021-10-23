import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsDocComponent } from './products-doc.component';

describe('ProductsDocComponent', () => {
  let component: ProductsDocComponent;
  let fixture: ComponentFixture<ProductsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
