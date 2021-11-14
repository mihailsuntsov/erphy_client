import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsOrderoutDialogComponent } from './settings-orderout-dialog.component';

describe('SettingsOrderoutDialogComponent', () => {
  let component: SettingsOrderoutDialogComponent;
  let fixture: ComponentFixture<SettingsOrderoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsOrderoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsOrderoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
