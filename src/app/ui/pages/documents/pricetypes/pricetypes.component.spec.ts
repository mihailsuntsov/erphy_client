import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricetypesComponent } from './pricetypes.component';

describe('PricetypesComponent', () => {
  let component: PricetypesComponent;
  let fixture: ComponentFixture<PricetypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricetypesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricetypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
