import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryDocComponent } from './inventory-doc.component';

describe('InventoryDocComponent', () => {
  let component: InventoryDocComponent;
  let fixture: ComponentFixture<InventoryDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
