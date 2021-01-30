import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingDialogComponent } from './pricing-dialog.component';

describe('PricingDialogComponent', () => {
  let component: PricingDialogComponent;
  let fixture: ComponentFixture<PricingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
