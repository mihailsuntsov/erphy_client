import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptanceDockComponent } from './acceptance-dock.component';

describe('AcceptanceDockComponent', () => {
  let component: AcceptanceDockComponent;
  let fixture: ComponentFixture<AcceptanceDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptanceDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptanceDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
