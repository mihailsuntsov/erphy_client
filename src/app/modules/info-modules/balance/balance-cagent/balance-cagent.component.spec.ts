import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceCagentComponent } from './balance-cagent.component';

describe('BalanceCagentComponent', () => {
  let component: BalanceCagentComponent;
  let fixture: ComponentFixture<BalanceCagentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BalanceCagentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BalanceCagentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
