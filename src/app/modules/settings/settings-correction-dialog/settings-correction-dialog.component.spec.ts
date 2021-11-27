import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsCorrectionDialogComponent } from './settings-correction-dialog.component';

describe('SettingsCorrectionDialogComponent', () => {
  let component: SettingsCorrectionDialogComponent;
  let fixture: ComponentFixture<SettingsCorrectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsCorrectionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsCorrectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
