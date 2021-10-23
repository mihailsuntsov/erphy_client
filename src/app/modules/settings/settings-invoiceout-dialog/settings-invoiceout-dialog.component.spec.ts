import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsInvoiceoutDialogComponent } from './settings-invoiceout-dialog.component';

describe('SettingsInvoiceoutDialogComponent', () => {
  let component: SettingsInvoiceoutDialogComponent;
  let fixture: ComponentFixture<SettingsInvoiceoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsInvoiceoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsInvoiceoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
