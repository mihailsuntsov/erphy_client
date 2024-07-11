import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAppointmentDialogComponent } from './settings-appointment-dialog.component';

describe('SettingsAppointmentDialogComponent', () => {
  let component: SettingsAppointmentDialogComponent;
  let fixture: ComponentFixture<SettingsAppointmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsAppointmentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsAppointmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
