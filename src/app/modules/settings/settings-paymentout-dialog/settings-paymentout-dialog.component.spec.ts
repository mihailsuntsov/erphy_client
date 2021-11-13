import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsPaymentoutDialogComponent } from './settings-paymentout-dialog.component';

describe('SettingsPaymentoutDialogComponent', () => {
  let component: SettingsPaymentoutDialogComponent;
  let fixture: ComponentFixture<SettingsPaymentoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsPaymentoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPaymentoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
