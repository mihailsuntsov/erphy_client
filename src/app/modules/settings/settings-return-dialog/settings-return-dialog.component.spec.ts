import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsReturnDialogComponent } from './settings-return-dialog.component';

describe('SettingsReturnDialogComponent', () => {
  let component: SettingsReturnDialogComponent;
  let fixture: ComponentFixture<SettingsReturnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsReturnDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsReturnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
