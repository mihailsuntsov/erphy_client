import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderoutComponent } from './orderout.component';

describe('OrderoutComponent', () => {
  let component: OrderoutComponent;
  let fixture: ComponentFixture<OrderoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
