import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawalDocComponent } from './withdrawal-doc.component';

describe('WithdrawalDocComponent', () => {
  let component: WithdrawalDocComponent;
  let fixture: ComponentFixture<WithdrawalDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawalDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawalDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
