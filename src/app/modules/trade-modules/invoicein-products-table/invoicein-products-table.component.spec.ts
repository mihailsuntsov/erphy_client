import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceinProductsTableComponent } from './invoicein-products-table.component';

describe('InvoiceinProductsTableComponent', () => {
  let component: InvoiceinProductsTableComponent;
  let fixture: ComponentFixture<InvoiceinProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceinProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceinProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
