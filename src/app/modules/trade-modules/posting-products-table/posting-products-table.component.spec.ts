import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostingProductsTableComponent } from './posting-products-table.component';

describe('PostingProductsTableComponent', () => {
  let component: PostingProductsTableComponent;
  let fixture: ComponentFixture<PostingProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostingProductsTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostingProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
