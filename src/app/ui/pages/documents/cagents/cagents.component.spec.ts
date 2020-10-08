import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CagentsComponent } from './cagents.component';

describe('CagentsComponent', () => {
  let component: CagentsComponent;
  let fixture: ComponentFixture<CagentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CagentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CagentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
