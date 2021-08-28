import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnDockComponent } from './return-dock.component';

describe('ReturnDockComponent', () => {
  let component: ReturnDockComponent;
  let fixture: ComponentFixture<ReturnDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
