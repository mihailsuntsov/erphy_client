import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentPartsComponent } from './department-parts.component';

describe('ProductCategoriesSelectComponent', () => {
  let component: DepartmentPartsComponent;
  let fixture: ComponentFixture<DepartmentPartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentPartsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentPartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
