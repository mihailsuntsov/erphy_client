import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteoffProductsTableComponent } from './writeoff-products-table.component';

describe('WriteoffProductsTableComponent', () => {
  let component: WriteoffProductsTableComponent;
  let fixture: ComponentFixture<WriteoffProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WriteoffProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteoffProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
