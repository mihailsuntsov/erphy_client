import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsupDockComponent } from './returnsup-dock.component';

describe('ReturnsupDockComponent', () => {
  let component: ReturnsupDockComponent;
  let fixture: ComponentFixture<ReturnsupDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsupDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsupDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
