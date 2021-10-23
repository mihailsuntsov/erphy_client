import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentsDocComponent } from './departments-doc.component';

describe('DepartmentsDocComponent', () => {
  let component: DepartmentsDocComponent;
  let fixture: ComponentFixture<DepartmentsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartmentsDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
