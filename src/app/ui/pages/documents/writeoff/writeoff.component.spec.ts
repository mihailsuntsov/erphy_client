import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteoffComponent } from './writeoff.component';

describe('WriteoffComponent', () => {
  let component: WriteoffComponent;
  let fixture: ComponentFixture<WriteoffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WriteoffComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteoffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
