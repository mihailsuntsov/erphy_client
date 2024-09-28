import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineschedulingComponent } from './onlinescheduling.component';

describe('OnlineschedulingComponent', () => {
  let component: OnlineschedulingComponent;
  let fixture: ComponentFixture<OnlineschedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnlineschedulingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnlineschedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
