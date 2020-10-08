import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdizmDockComponent } from './edizm-dock.component';

describe('EdizmDockComponent', () => {
  let component: EdizmDockComponent;
  let fixture: ComponentFixture<EdizmDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EdizmDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EdizmDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
