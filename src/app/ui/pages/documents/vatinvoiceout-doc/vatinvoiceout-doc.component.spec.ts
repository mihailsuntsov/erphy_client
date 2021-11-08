import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatinvoiceoutDocComponent } from './vatinvoiceout-doc.component';

describe('VatinvoiceoutDocComponent', () => {
  let component: VatinvoiceoutDocComponent;
  let fixture: ComponentFixture<VatinvoiceoutDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VatinvoiceoutDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VatinvoiceoutDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
