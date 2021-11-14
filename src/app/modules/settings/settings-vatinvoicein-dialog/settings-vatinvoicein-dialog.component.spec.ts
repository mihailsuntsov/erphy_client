import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsVatinvoiceinDialogComponent } from './settings-vatinvoicein-dialog.component';

describe('SettingsVatinvoiceinDialogComponent', () => {
  let component: SettingsVatinvoiceinDialogComponent;
  let fixture: ComponentFixture<SettingsVatinvoiceinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsVatinvoiceinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsVatinvoiceinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
