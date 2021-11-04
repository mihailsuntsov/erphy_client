import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderinDocComponent } from './orderin-doc.component';

describe('OrderinDocComponent', () => {
  let component: OrderinDocComponent;
  let fixture: ComponentFixture<OrderinDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderinDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderinDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
