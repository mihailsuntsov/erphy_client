import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusesDocComponent } from './statuses-doc.component';

describe('StatusesDocComponent', () => {
  let component: StatusesDocComponent;
  let fixture: ComponentFixture<StatusesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
