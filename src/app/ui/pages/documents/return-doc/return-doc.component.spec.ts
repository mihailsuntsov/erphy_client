import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnDocComponent } from './return-doc.component';

describe('ReturnDocComponent', () => {
  let component: ReturnDocComponent;
  let fixture: ComponentFixture<ReturnDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
