import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsCalendarDialogComponent } from './settings-calendar-dialog.component';

describe('SettingsCalendarDialogComponent', () => {
  let component: SettingsCalendarDialogComponent;
  let fixture: ComponentFixture<SettingsCalendarDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsCalendarDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsCalendarDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
