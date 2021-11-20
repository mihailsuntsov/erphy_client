import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxofficeComponent } from './boxoffice.component';

describe('BoxofficeComponent', () => {
  let component: BoxofficeComponent;
  let fixture: ComponentFixture<BoxofficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoxofficeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxofficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
