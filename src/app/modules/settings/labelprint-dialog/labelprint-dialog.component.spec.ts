import { ComponentFixture, TestBed } from '@angular/core/testing';

import {LabelsPrintDialogComponent } from './labelprint-dialog.component';

describe('LabelsPrintDialogComponent', () => {
  let component:LabelsPrintDialogComponent;
  let fixture: ComponentFixture<LabelsPrintDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LabelsPrintDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelsPrintDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
