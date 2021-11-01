import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceinDocComponent } from './invoicein-doc.component';

describe('InvoiceinDocComponent', () => {
  let component: InvoiceinDocComponent;
  let fixture: ComponentFixture<InvoiceinDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceinDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceinDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
