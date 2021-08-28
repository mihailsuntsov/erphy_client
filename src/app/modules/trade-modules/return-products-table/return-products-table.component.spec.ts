import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnProductsTableComponent } from './return-products-table.component';

describe('ReturnProductsTableComponent', () => {
  let component: ReturnProductsTableComponent;
  let fixture: ComponentFixture<ReturnProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
