import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemainsDialogComponent } from './remains-dialog.component';

describe('RemainsDialogComponent', () => {
  let component: RemainsDialogComponent;
  let fixture: ComponentFixture<RemainsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemainsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemainsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
