import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersDocComponent } from './users-doc.component';

const routes: Routes = [
  { path: '', component: UsersDocComponent },
  { path: ':id', component: UsersDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersDocRoutingModule { }
