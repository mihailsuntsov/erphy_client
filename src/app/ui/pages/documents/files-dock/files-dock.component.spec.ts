import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesDockComponent } from './files-dock.component';

describe('FilesDockComponent', () => {
  let component: FilesDockComponent;
  let fixture: ComponentFixture<FilesDockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesDockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesDockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
