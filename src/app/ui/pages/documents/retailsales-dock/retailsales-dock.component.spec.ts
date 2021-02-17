import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailsalesDockComponent } from './retailsales-dock.component';

describe('RetailsalesDockComponent', () => {
  let component: RetailsalesDockComponent;
  let fixture: ComponentFixture<RetailsalesDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailsalesDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailsalesDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
