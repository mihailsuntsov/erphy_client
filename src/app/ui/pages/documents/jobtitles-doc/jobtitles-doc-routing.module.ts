import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { JobtitlesDocComponent } from './jobtitles-doc.component';

const routes: Routes = [
  { path: '', component: JobtitlesDocComponent },
  { path: ':id', component: JobtitlesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobtitlesDocRoutingModule { }
