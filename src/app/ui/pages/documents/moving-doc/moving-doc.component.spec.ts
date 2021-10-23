import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovingDocComponent } from './moving-doc.component';

describe('MovingDocComponent', () => {
  let component: MovingDocComponent;
  let fixture: ComponentFixture<MovingDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovingDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovingDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
