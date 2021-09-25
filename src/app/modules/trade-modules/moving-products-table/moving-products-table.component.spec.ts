import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovingProductsTableComponent } from './moving-products-table.component';

describe('MovingProductsTableComponent', () => {
  let component: MovingProductsTableComponent;
  let fixture: ComponentFixture<MovingProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovingProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovingProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
