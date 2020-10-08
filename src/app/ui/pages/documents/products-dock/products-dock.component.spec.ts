import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsDockComponent } from './products-dock.component';

describe('ProductsDockComponent', () => {
  let component: ProductsDockComponent;
  let fixture: ComponentFixture<ProductsDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
