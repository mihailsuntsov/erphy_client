import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentDockComponent } from './shipment-dock.component';

describe('ShipmentDockComponent', () => {
  let component: ShipmentDockComponent;
  let fixture: ComponentFixture<ShipmentDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShipmentDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShipmentDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
