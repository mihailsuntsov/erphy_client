import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptanceDocComponent } from './acceptance-doc.component';

describe('AcceptanceDocComponent', () => {
  let component: AcceptanceDocComponent;
  let fixture: ComponentFixture<AcceptanceDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptanceDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptanceDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
