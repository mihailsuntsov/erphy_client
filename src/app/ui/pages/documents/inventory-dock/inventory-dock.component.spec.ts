import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryDockComponent } from './inventory-dock.component';

describe('InventoryDockComponent', () => {
  let component: InventoryDockComponent;
  let fixture: ComponentFixture<InventoryDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
