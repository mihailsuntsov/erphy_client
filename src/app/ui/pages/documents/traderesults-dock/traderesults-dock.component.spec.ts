import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraderesultsDockComponent } from './traderesults-dock.component';

describe('TraderesultsDockComponent', () => {
  let component: TraderesultsDockComponent;
  let fixture: ComponentFixture<TraderesultsDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraderesultsDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraderesultsDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
