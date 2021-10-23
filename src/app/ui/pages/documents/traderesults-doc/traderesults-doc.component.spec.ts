import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraderesultsDocComponent } from './traderesults-doc.component';

describe('TraderesultsDocComponent', () => {
  let component: TraderesultsDocComponent;
  let fixture: ComponentFixture<TraderesultsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraderesultsDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraderesultsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
