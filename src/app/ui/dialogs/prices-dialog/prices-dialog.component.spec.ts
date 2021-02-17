import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PricesDialogComponent } from './prices-dialog.component';

describe('PricesDialogComponent', () => {
  let component: PricesDialogComponent;
  let fixture: ComponentFixture<PricesDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PricesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PricesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
