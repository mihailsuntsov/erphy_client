import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductgroupsComponent } from './productgroups.component';

describe('ProductgroupsComponent', () => {
  let component: ProductgroupsComponent;
  let fixture: ComponentFixture<ProductgroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductgroupsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductgroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
