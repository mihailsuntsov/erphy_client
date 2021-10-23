import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductgroupsDocComponent } from './productgroups-doc.component';

describe('ProductgroupsDocComponent', () => {
  let component: ProductgroupsDocComponent;
  let fixture: ComponentFixture<ProductgroupsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductgroupsDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductgroupsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
