import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenditureDocComponent } from './expenditure-doc.component';

describe('ExpenditureDocComponent', () => {
  let component: ExpenditureDocComponent;
  let fixture: ComponentFixture<ExpenditureDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpenditureDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenditureDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
