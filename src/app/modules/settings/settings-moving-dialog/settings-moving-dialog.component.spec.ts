import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsMovingDialogComponent } from './settings-moving-dialog.component';

describe('SettingsMovingDialogComponent', () => {
  let component: SettingsMovingDialogComponent;
  let fixture: ComponentFixture<SettingsMovingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsMovingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsMovingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
