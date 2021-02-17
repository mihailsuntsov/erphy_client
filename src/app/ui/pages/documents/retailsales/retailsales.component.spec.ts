import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailsalesComponent } from './retailsales.component';

describe('RetailsalesComponent', () => {
  let component: RetailsalesComponent;
  let fixture: ComponentFixture<RetailsalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailsalesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailsalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
