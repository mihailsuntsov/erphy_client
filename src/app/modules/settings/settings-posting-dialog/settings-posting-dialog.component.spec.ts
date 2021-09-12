import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsPostingDialogComponent } from './settings-posting-dialog.component';

describe('SettingsPostingDialogComponent', () => {
  let component: SettingsPostingDialogComponent;
  let fixture: ComponentFixture<SettingsPostingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsPostingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPostingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
