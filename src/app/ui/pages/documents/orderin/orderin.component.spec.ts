import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderinComponent } from './orderin.component';

describe('OrderinComponent', () => {
  let component: OrderinComponent;
  let fixture: ComponentFixture<OrderinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
