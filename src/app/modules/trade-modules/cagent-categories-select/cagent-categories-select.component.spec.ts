import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CagentCategoriesSelectComponent } from './cagent-categories-select.component';

describe('CagentCategoriesSelectComponent', () => {
  let component: CagentCategoriesSelectComponent;
  let fixture: ComponentFixture<CagentCategoriesSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CagentCategoriesSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CagentCategoriesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
