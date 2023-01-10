import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileCategoriesSelectComponent } from './file-categories-select.component';

describe('FileCategoriesSelectComponent', () => {
  let component: FileCategoriesSelectComponent;
  let fixture: ComponentFixture<FileCategoriesSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileCategoriesSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileCategoriesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
