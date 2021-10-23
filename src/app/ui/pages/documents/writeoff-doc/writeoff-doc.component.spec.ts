import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteoffDocComponent } from './writeoff-doc.component';

describe('WriteoffDocComponent', () => {
  let component: WriteoffDocComponent;
  let fixture: ComponentFixture<WriteoffDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WriteoffDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteoffDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
