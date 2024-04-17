import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayViewSchedulerComponent } from './day-view-scheduler.component';

describe('DayViewSchedulerComponent', () => {
  let component: DayViewSchedulerComponent;
  let fixture: ComponentFixture<DayViewSchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayViewSchedulerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DayViewSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
