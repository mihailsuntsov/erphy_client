import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsReturnsupDialogComponent } from './settings-returnsup-dialog.component';

describe('SettingsReturnsupDialogComponent', () => {
  let component: SettingsReturnsupDialogComponent;
  let fixture: ComponentFixture<SettingsReturnsupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsReturnsupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsReturnsupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
