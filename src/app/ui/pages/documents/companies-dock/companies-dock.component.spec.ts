import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompaniesDockComponent } from './companies-dock.component';

describe('CompaniesDockComponent', () => {
  let component: CompaniesDockComponent;
  let fixture: ComponentFixture<CompaniesDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompaniesDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompaniesDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
