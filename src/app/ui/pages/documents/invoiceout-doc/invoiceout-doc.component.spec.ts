import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceoutDocComponent } from './invoiceout-doc.component';

describe('InvoiceoutDocComponent', () => {
  let component: InvoiceoutDocComponent;
  let fixture: ComponentFixture<InvoiceoutDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceoutDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceoutDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
