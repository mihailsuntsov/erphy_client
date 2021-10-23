import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostingDocComponent } from './posting-doc.component';

const routes: Routes = [
  { path: '', component: PostingDocComponent },
  { path: ':id', component: PostingDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostingDocRoutingModule { }
