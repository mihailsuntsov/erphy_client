import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsInventoryDialogComponent } from './settings-inventory-dialog.component';

describe('SettingsInventoryDialogComponent', () => {
  let component: SettingsInventoryDialogComponent;
  let fixture: ComponentFixture<SettingsInventoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsInventoryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsInventoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
