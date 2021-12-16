import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositingDocComponent } from './depositing-doc.component';

describe('DepositingDocComponent', () => {
  let component: DepositingDocComponent;
  let fixture: ComponentFixture<DepositingDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositingDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositingDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
