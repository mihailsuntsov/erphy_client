import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostingDockComponent } from './posting-dock.component';

const routes: Routes = [
  { path: '', component: PostingDockComponent },
  { path: ':id', component: PostingDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostingDockRoutingModule { }
