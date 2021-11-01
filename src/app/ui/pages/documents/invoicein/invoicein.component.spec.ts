import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceinComponent } from './invoicein.component';

describe('InvoiceinComponent', () => {
  let component: InvoiceinComponent;
  let fixture: ComponentFixture<InvoiceinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
