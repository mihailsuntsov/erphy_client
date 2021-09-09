import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsupProductsTableComponent } from './returnsup-products-table.component';

describe('ReturnsupProductsTableComponent', () => {
  let component: ReturnsupProductsTableComponent;
  let fixture: ComponentFixture<ReturnsupProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnsupProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsupProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
