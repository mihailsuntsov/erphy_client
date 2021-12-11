import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceKassaComponent } from './balance-kassa.component';

describe('BalanceKassaComponent', () => {
  let component: BalanceKassaComponent;
  let fixture: ComponentFixture<BalanceKassaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BalanceKassaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BalanceKassaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
