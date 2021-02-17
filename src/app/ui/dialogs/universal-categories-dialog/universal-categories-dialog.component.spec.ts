import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UniversalCategoriesDialogComponent } from './universal-categories-dialog.component';

describe('UniversalCategoriesDialogComponent', () => {
  let component: UniversalCategoriesDialogComponent;
  let fixture: ComponentFixture<UniversalCategoriesDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UniversalCategoriesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UniversalCategoriesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
