import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoresSelectComponent } from './stores-select.component';

describe('StoresSelectComponent', () => {
  let component: StoresSelectComponent;
  let fixture: ComponentFixture<StoresSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoresSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoresSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
