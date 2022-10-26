import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAttributeDocComponent } from './productattributes-doc.component';

describe('ProductAttributeDocComponent', () => {
  let component: ProductAttributeDocComponent;
  let fixture: ComponentFixture<ProductAttributeDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductAttributeDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAttributeDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
