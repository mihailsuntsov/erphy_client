import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptanceProductsTableComponent } from './acceptance-products-table.component';

describe('AcceptanceProductsTableComponent', () => {
  let component: AcceptanceProductsTableComponent;
  let fixture: ComponentFixture<AcceptanceProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptanceProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptanceProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
