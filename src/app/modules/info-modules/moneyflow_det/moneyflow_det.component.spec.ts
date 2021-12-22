import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyflowDetComponent } from './moneyflow_det.component';

describe('MoneyflowDetComponent', () => {
  let component: MoneyflowDetComponent;
  let fixture: ComponentFixture<MoneyflowDetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoneyflowDetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoneyflowDetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
