import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsergroupComponent } from './usergroup.component';

const routes: Routes = [{ path: '', component: UsergroupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsergroupRoutingModule { }
