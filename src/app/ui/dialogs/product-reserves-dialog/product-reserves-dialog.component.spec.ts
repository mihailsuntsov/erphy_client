import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductReservesDialogComponent } from './product-reserves-dialog.component';

describe('ProductReservesDialogComponent', () => {
  let component: ProductReservesDialogComponent;
  let fixture: ComponentFixture<ProductReservesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductReservesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductReservesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
