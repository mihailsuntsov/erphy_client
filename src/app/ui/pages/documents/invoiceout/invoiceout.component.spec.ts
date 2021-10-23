import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceoutComponent } from './invoiceout.component';

describe('InvoiceoutComponent', () => {
  let component: InvoiceoutComponent;
  let fixture: ComponentFixture<InvoiceoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
