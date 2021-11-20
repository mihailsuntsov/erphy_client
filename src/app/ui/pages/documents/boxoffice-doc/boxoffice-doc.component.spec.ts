import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxofficeDocComponent } from './boxoffice-doc.component';

describe('BoxofficeDocComponent', () => {
  let component: BoxofficeDocComponent;
  let fixture: ComponentFixture<BoxofficeDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoxofficeDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxofficeDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
