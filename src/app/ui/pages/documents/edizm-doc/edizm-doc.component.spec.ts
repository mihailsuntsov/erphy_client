import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdizmDocComponent } from './edizm-doc.component';

describe('EdizmDocComponent', () => {
  let component: EdizmDocComponent;
  let fixture: ComponentFixture<EdizmDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EdizmDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EdizmDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
