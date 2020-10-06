import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesUploadDialogComponent } from './files-upload-dialog.component';

describe('FilesUploadDialogComponent', () => {
  let component: FilesUploadDialogComponent;
  let fixture: ComponentFixture<FilesUploadDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilesUploadDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
