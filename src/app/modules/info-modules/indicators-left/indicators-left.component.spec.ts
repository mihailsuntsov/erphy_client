import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorsLeftComponent } from './indicators-left.component';

describe('IndicatorsLeftComponent', () => {
  let component: IndicatorsLeftComponent;
  let fixture: ComponentFixture<IndicatorsLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndicatorsLeftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndicatorsLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
