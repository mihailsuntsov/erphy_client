import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositingComponent } from './depositing.component';

describe('DepositingComponent', () => {
  let component: DepositingComponent;
  let fixture: ComponentFixture<DepositingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
