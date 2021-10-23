import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsupDocComponent } from './returnsup-doc.component';

describe('ReturnsupDocComponent', () => {
  let component: ReturnsupDocComponent;
  let fixture: ComponentFixture<ReturnsupDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsupDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsupDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
