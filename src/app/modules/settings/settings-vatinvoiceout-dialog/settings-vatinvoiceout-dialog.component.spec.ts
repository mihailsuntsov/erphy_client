import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsVatinvoiceoutDialogComponent } from './settings-vatinvoiceout-dialog.component';

describe('SettingsVatinvoiceoutDialogComponent', () => {
  let component: SettingsVatinvoiceoutDialogComponent;
  let fixture: ComponentFixture<SettingsVatinvoiceoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsVatinvoiceoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsVatinvoiceoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
