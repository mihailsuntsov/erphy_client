import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdizmComponent } from './edizm.component';

describe('EdizmComponent', () => {
  let component: EdizmComponent;
  let fixture: ComponentFixture<EdizmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EdizmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EdizmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
