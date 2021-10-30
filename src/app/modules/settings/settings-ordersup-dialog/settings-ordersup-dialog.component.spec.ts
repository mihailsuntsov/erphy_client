import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsOrdersupDialogComponent } from './settings-ordersup-dialog.component';

describe('SettingsOrdersupDialogComponent', () => {
  let component: SettingsOrdersupDialogComponent;
  let fixture: ComponentFixture<SettingsOrdersupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsOrdersupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsOrdersupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
