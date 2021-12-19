import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MutualpaymentComponent } from './mutualpayment.component';

describe('MutualpaymentComponent', () => {
  let component: MutualpaymentComponent;
  let fixture: ComponentFixture<MutualpaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MutualpaymentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MutualpaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
