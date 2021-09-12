import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsWriteoffDialogComponent } from './settings-writeoff-dialog.component';

describe('SettingsWriteoffDialogComponent', () => {
  let component: SettingsWriteoffDialogComponent;
  let fixture: ComponentFixture<SettingsWriteoffDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsWriteoffDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsWriteoffDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
