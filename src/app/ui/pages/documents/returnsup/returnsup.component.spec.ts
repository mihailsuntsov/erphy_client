import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsupComponent } from './returnsup.component';

describe('ReturnsupComponent', () => {
  let component: ReturnsupComponent;
  let fixture: ComponentFixture<ReturnsupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
