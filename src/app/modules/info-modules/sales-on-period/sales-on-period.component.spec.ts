import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesOnPeriodComponent } from './sales-on-period.component';

describe('SalesOnPeriodComponent', () => {
  let component: SalesOnPeriodComponent;
  let fixture: ComponentFixture<SalesOnPeriodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalesOnPeriodComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesOnPeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
