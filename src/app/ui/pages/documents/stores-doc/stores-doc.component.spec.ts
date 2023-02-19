import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoresDocComponent } from './stores-doc.component';

describe('StoresDocComponent', () => {
  let component: StoresDocComponent;
  let fixture: ComponentFixture<StoresDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoresDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoresDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
