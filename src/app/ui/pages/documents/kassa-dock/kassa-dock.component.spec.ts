import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KassaDockComponent } from './kassa-dock.component';

describe('KassaDockComponent', () => {
  let component: KassaDockComponent;
  let fixture: ComponentFixture<KassaDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KassaDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KassaDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
