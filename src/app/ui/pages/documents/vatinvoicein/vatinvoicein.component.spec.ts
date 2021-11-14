import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatinvoiceinComponent } from './vatinvoicein.component';

describe('VatinvoiceinComponent', () => {
  let component: VatinvoiceinComponent;
  let fixture: ComponentFixture<VatinvoiceinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VatinvoiceinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VatinvoiceinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
