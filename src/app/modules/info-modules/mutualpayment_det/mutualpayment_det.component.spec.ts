import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MutualpaymentDetComponent } from './mutualpayment_det.component';

describe('MutualpaymentDetComponent', () => {
  let component: MutualpaymentDetComponent;
  let fixture: ComponentFixture<MutualpaymentDetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MutualpaymentDetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MutualpaymentDetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
