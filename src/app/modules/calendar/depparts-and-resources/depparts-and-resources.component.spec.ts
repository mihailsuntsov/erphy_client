import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeppartsAndResourcesComponent } from './depparts-and-resources.component';

describe('DayViewSchedulerComponent', () => {
  let component: DeppartsAndResourcesComponent;
  let fixture: ComponentFixture<DeppartsAndResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeppartsAndResourcesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeppartsAndResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
