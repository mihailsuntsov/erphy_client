import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesDocComponent } from './files-doc.component';

describe('FilesDocComponent', () => {
  let component: FilesDocComponent;
  let fixture: ComponentFixture<FilesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
