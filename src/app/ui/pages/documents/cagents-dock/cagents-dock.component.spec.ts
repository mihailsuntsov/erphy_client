import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CagentsDockComponent } from './cagents-dock.component';

describe('CagentsDockComponent', () => {
  let component: CagentsDockComponent;
  let fixture: ComponentFixture<CagentsDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CagentsDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CagentsDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
