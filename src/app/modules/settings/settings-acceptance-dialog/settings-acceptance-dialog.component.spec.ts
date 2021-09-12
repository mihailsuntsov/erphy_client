import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAcceptanceDialogComponent } from './settings-acceptance-dialog.component';

describe('SettingsAcceptanceDialogComponent', () => {
  let component: SettingsAcceptanceDialogComponent;
  let fixture: ComponentFixture<SettingsAcceptanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsAcceptanceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsAcceptanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
