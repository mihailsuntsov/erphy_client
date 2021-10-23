import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompaniesDocComponent } from './companies-doc.component';

describe('CompaniesDocComponent', () => {
  let component: CompaniesDocComponent;
  let fixture: ComponentFixture<CompaniesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompaniesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompaniesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
