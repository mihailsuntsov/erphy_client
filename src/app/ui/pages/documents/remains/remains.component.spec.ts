import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemainsComponent } from './remains.component';

describe('RemainsComponent', () => {
  let component: RemainsComponent;
  let fixture: ComponentFixture<RemainsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemainsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemainsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
