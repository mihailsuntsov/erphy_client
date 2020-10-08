import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsergroupDockComponent } from './usergroup-dock.component';

const routes: Routes = [
  { path: '', component: UsergroupDockComponent },
  { path: ':id', component: UsergroupDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsergroupDockRoutingModule { }
