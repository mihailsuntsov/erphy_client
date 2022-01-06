import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpexComponent } from './opex.component';

describe('OpexComponent', () => {
  let component: OpexComponent;
  let fixture: ComponentFixture<OpexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpexComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
