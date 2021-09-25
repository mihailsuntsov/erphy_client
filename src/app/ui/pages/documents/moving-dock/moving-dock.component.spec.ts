import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovingDockComponent } from './moving-dock.component';

describe('MovingDockComponent', () => {
  let component: MovingDockComponent;
  let fixture: ComponentFixture<MovingDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovingDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovingDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
