import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricetypesDocComponent } from './pricetypes-doc.component';

describe('PricetypesDocComponent', () => {
  let component: PricetypesDocComponent;
  let fixture: ComponentFixture<PricetypesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricetypesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricetypesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
