import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraderesultsComponent } from './traderesults.component';

describe('TraderesultsComponent', () => {
  let component: TraderesultsComponent;
  let fixture: ComponentFixture<TraderesultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraderesultsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraderesultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
