import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobtitlesRoutingModule } from './jobtitles-routing.module';
import { JobtitlesComponent } from './jobtitles.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [JobtitlesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    JobtitlesRoutingModule,    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class JobtitlesModule { }
