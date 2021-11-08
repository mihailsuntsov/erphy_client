import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatinvoiceoutComponent } from './vatinvoiceout.component';

describe('VatinvoiceoutComponent', () => {
  let component: VatinvoiceoutComponent;
  let fixture: ComponentFixture<VatinvoiceoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VatinvoiceoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VatinvoiceoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
