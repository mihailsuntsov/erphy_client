import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsInvoiceinDialogComponent } from './settings-invoicein-dialog.component';

describe('SettingsInvoiceinDialogComponent', () => {
  let component: SettingsInvoiceinDialogComponent;
  let fixture: ComponentFixture<SettingsInvoiceinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsInvoiceinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsInvoiceinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
