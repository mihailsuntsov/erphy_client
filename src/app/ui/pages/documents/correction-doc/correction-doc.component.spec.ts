import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrectionDocComponent } from './correction-doc.component';

describe('CorrectionDocComponent', () => {
  let component: CorrectionDocComponent;
  let fixture: ComponentFixture<CorrectionDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CorrectionDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorrectionDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
