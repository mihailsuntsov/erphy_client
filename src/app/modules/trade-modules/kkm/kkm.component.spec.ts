import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KkmComponent } from './kkm.component';

describe('KkmComponent', () => {
  let component: KkmComponent;
  let fixture: ComponentFixture<KkmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KkmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KkmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
