import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsergroupDocComponent } from './usergroup-doc.component';

const routes: Routes = [
  { path: '', component: UsergroupDocComponent },
  { path: ':id', component: UsergroupDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsergroupDocRoutingModule { }
