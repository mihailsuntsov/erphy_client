import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatinvoiceinDocComponent } from './vatinvoicein-doc.component';

describe('VatinvoiceinDocComponent', () => {
  let component: VatinvoiceinDocComponent;
  let fixture: ComponentFixture<VatinvoiceinDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VatinvoiceinDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VatinvoiceinDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
