import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderoutDocComponent } from './orderout-doc.component';

describe('OrderoutDocComponent', () => {
  let component: OrderoutDocComponent;
  let fixture: ComponentFixture<OrderoutDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderoutDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderoutDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
