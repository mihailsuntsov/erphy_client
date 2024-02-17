import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesDocComponent } from './resources-doc.component';

describe('ResourcesDocComponent', () => {
  let component: ResourcesDocComponent;
  let fixture: ComponentFixture<ResourcesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourcesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
