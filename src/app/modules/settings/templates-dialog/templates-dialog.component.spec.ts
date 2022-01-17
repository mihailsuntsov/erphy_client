import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesDialogComponent } from './templates-dialog.component';

describe('TemplatesDialogComponent', () => {
  let component: TemplatesDialogComponent;
  let fixture: ComponentFixture<TemplatesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplatesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
