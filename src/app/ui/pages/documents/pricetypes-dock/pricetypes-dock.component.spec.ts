import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricetypesDockComponent } from './pricetypes-dock.component';

describe('PricetypesDockComponent', () => {
  let component: PricetypesDockComponent;
  let fixture: ComponentFixture<PricetypesDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PricetypesDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PricetypesDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
