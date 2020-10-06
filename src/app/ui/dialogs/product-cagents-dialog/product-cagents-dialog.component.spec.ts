import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCagentsDialogComponent } from './product-cagents-dialog.component';

describe('ProductCagentsDialogComponent', () => {
  let component: ProductCagentsDialogComponent;
  let fixture: ComponentFixture<ProductCagentsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductCagentsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCagentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
