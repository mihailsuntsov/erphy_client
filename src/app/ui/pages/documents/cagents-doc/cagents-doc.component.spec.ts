import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CagentsDocComponent } from './cagents-doc.component';

describe('CagentsDocComponent', () => {
  let component: CagentsDocComponent;
  let fixture: ComponentFixture<CagentsDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CagentsDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CagentsDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
