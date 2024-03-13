import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JobtitlesComponent } from './jobtitles.component';

const routes: Routes = [{ path: '', component: JobtitlesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobtitlesRoutingModule { }
