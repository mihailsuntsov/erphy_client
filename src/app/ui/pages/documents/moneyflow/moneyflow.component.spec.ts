import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyflowComponent } from './moneyflow.component';

describe('MoneyflowComponent', () => {
  let component: MoneyflowComponent;
  let fixture: ComponentFixture<MoneyflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoneyflowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoneyflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
