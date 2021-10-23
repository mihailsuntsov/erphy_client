import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StatusesDocComponent } from './statuses-doc.component';

const routes: Routes = [
  { path: '', component: StatusesDocComponent },
  { path: ':id', component: StatusesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StatusesDocRoutingModule { }
