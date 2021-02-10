import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsCustomersordersDialogComponent } from './settings-customersorders-dialog.component';

describe('SettingsCustomersordersDialogComponent', () => {
  let component: SettingsCustomersordersDialogComponent;
  let fixture: ComponentFixture<SettingsCustomersordersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsCustomersordersDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsCustomersordersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
