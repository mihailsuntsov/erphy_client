import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobtitlesDocComponent } from './jobtitles-doc.component';

describe('JobtitlesDocComponent', () => {
  let component: JobtitlesDocComponent;
  let fixture: ComponentFixture<JobtitlesDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobtitlesDocComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobtitlesDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
