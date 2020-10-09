import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PostingComponent } from './posting.component';

const routes: Routes = [{ path: '', component: PostingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostingRoutingModule { }
