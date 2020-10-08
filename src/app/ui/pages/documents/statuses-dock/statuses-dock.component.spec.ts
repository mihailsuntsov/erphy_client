import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusesDockComponent } from './statuses-dock.component';

describe('StatusesDockComponent', () => {
  let component: StatusesDockComponent;
  let fixture: ComponentFixture<StatusesDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusesDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusesDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
