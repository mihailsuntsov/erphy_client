import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewpassComponent } from './newpass.component';

describe('NewpassComponent', () => {
  let component: NewpassComponent;
  let fixture: ComponentFixture<NewpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
