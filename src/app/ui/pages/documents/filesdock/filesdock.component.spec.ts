import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesdockComponent } from './filesdock.component';

describe('FilesdockComponent', () => {
  let component: FilesdockComponent;
  let fixture: ComponentFixture<FilesdockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesdockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesdockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
