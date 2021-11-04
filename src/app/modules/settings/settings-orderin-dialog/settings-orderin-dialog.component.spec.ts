import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsOrderinDialogComponent } from './settings-orderin-dialog.component';

describe('SettingsOrderinDialogComponent', () => {
  let component: SettingsOrderinDialogComponent;
  let fixture: ComponentFixture<SettingsOrderinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsOrderinDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsOrderinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
