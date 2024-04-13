import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersordersDocComponent } from './appointments-doc.component';

describe('CustomersordersDocComponent', () => {
  let component: CustomersordersDocComponent;
  let fixture: ComponentFixture<CustomersordersDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomersordersDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersordersDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
