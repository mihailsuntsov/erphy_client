import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupFieldsDialogComponent } from './product-group-fields-dialog.component';

describe('ProductGroupFieldsDialogComponent', () => {
  let component: ProductGroupFieldsDialogComponent;
  let fixture: ComponentFixture<ProductGroupFieldsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductGroupFieldsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductGroupFieldsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
