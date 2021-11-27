import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrectionComponent } from './correction.component';

describe('CorrectionComponent', () => {
  let component: CorrectionComponent;
  let fixture: ComponentFixture<CorrectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CorrectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorrectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
