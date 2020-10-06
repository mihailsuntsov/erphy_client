import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductBarcodesDialogComponent } from './product-barcodes-dialog.component';

describe('ProductBarcodesDialogComponent', () => {
  let component: ProductBarcodesDialogComponent;
  let fixture: ComponentFixture<ProductBarcodesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductBarcodesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductBarcodesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
