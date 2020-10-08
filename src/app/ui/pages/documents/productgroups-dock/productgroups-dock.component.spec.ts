import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductgroupsDockComponent } from './productgroups-dock.component';

describe('ProductgroupsDockComponent', () => {
  let component: ProductgroupsDockComponent;
  let fixture: ComponentFixture<ProductgroupsDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductgroupsDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductgroupsDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
