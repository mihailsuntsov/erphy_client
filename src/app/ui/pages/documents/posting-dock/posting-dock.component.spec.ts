import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostingDockComponent } from './posting-dock.component';

describe('PostingDockComponent', () => {
  let component: PostingDockComponent;
  let fixture: ComponentFixture<PostingDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostingDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostingDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
