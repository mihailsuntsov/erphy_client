import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KassaDocComponent } from './kassa-doc.component';

describe('KassaDocComponent', () => {
  let component: KassaDocComponent;
  let fixture: ComponentFixture<KassaDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KassaDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KassaDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
