import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxesDocComponent } from './taxes-doc.component';

describe('TaxesDocComponent', () => {
  let component: TaxesDocComponent;
  let fixture: ComponentFixture<TaxesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaxesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
