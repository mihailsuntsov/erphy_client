import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceBoxofficeComponent } from './balance-boxoffice.component';

describe('BalanceBoxofficeComponent', () => {
  let component: BalanceBoxofficeComponent;
  let fixture: ComponentFixture<BalanceBoxofficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BalanceBoxofficeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BalanceBoxofficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
