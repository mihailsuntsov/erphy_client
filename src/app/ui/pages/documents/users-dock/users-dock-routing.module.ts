import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersDockComponent } from './users-dock.component';

const routes: Routes = [
  { path: '', component: UsersDockComponent },
  { path: ':id', component: UsersDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersDockRoutingModule { }
