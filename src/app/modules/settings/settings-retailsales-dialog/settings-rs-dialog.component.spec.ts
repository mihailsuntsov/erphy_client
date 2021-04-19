import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsRetailsalesDialogComponent } from './settings-rs-dialog.component';

describe('SettingsRetailsalesDialogComponent', () => {
  let component: SettingsRetailsalesDialogComponent;
  let fixture: ComponentFixture<SettingsRetailsalesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsRetailsalesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsRetailsalesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
