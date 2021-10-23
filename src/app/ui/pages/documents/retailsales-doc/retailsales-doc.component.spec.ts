import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailsalesDocComponent } from './retailsales-doc.component';

describe('RetailsalesDocComponent', () => {
  let component: RetailsalesDocComponent;
  let fixture: ComponentFixture<RetailsalesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailsalesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailsalesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
