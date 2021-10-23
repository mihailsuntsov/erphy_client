import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentDocComponent } from './shipment-doc.component';

describe('ShipmentDocComponent', () => {
  let component: ShipmentDocComponent;
  let fixture: ComponentFixture<ShipmentDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShipmentDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShipmentDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
