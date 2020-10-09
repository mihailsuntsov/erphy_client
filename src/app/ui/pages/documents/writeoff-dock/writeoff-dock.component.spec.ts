import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteoffDockComponent } from './writeoff-dock.component';

describe('WriteoffDockComponent', () => {
  let component: WriteoffDockComponent;
  let fixture: ComponentFixture<WriteoffDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WriteoffDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteoffDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
