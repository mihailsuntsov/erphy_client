import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrenciesDocComponent } from './currencies-doc.component';

describe('CurrenciesDocComponent', () => {
  let component: CurrenciesDocComponent;
  let fixture: ComponentFixture<CurrenciesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrenciesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrenciesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
