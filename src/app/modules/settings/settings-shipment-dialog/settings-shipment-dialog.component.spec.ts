import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsShipmentDialogComponent } from './settings-shipment-dialog.component';

describe('SettingsShipmentDialogComponent', () => {
  let component: SettingsShipmentDialogComponent;
  let fixture: ComponentFixture<SettingsShipmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsShipmentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsShipmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
