import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraderesultsReportComponent } from './traderesults-report.component';

describe('TraderesultsReportComponent', () => {
  let component: TraderesultsReportComponent;
  let fixture: ComponentFixture<TraderesultsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraderesultsReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraderesultsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
