import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAppointmentsDialogComponent } from './settings-appointments-dialog.component';

describe('SettingsAppointmentsDialogComponent', () => {
  let component: SettingsAppointmentsDialogComponent;
  let fixture: ComponentFixture<SettingsAppointmentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsAppointmentsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsAppointmentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
