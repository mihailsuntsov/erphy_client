import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsPaymentinDialogComponent } from './settings-paymentin-dialog.component';

describe('SettingsPaymentinDialogComponent', () => {
  let component: SettingsPaymentinDialogComponent;
  let fixture: ComponentFixture<SettingsPaymentinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsPaymentinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPaymentinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
