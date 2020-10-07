import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FilesdockComponent } from './filesdock.component';

const routes: Routes = [
  { path: '', component: FilesdockComponent },
  { path: ':id', component: FilesdockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FilesdockRoutingModule { }
