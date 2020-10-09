import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersordersDockComponent } from './customersorders-dock.component';

describe('CustomersordersDockComponent', () => {
  let component: CustomersordersDockComponent;
  let fixture: ComponentFixture<CustomersordersDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomersordersDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersordersDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
