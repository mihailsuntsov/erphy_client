import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceAccountComponent } from './balance-account.component';

describe('BalanceAccountComponent', () => {
  let component: BalanceAccountComponent;
  let fixture: ComponentFixture<BalanceAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BalanceAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BalanceAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
