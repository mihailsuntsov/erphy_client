import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostingDocComponent } from './posting-doc.component';

describe('PostingDocComponent', () => {
  let component: PostingDocComponent;
  let fixture: ComponentFixture<PostingDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostingDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostingDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
